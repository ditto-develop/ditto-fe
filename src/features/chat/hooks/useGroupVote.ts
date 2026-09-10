"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  castVote as castVoteRequest,
  closeVote as closeVoteRequest,
  createVote as createVoteRequest,
  getRoomVotes,
} from "@/features/chat/api/voteApi";
import { trackEvent } from "@/shared/lib/analytics";
import { findOpenVote } from "@/features/chat/lib/voteResult";
import { parseVoteSystemMessage } from "@/features/chat/lib/roomState";
import type {
  CastVoteRequest,
  ChatMessage,
  CreateGroupVoteRequest,
  GroupVote,
} from "@/features/chat/model/types";

type UseGroupVoteOptions = {
  /** 방 메시지. 투표는 별도 destination이 없어 SYSTEM 메시지로만 실시간 신호가 온다. */
  messages: ChatMessage[];
  /** 그룹 방에서만 켠다. 1:1·재매칭에 호출하면 서버가 8208로 거절한다. */
  enabled: boolean;
};

type UseGroupVoteResult = {
  /** 최신순. 목록 REST가 화면 복구의 기준이다. */
  votes: GroupVote[];
  /** 진행 중인 투표. 방당 하나뿐이라 배너·생성 진입점 판정은 이 값 하나로 끝난다. */
  openVote: GroupVote | null;
  loading: boolean;
  error: string | null;
  getVoteById: (voteId: number) => GroupVote | null;
  refresh: () => Promise<void>;
  create: (body: CreateGroupVoteRequest) => Promise<GroupVote>;
  cast: (voteId: number, body: CastVoteRequest) => Promise<GroupVote>;
  close: (voteId: number) => Promise<GroupVote>;
};

/** 갱신된 상세로 목록을 갈아끼운다. 없던 투표면 최신이므로 맨 앞에 넣는다. */
function upsertVote(votes: GroupVote[], updated: GroupVote): GroupVote[] {
  const index = votes.findIndex((vote) => vote.voteId === updated.voteId);
  if (index < 0) return [updated, ...votes];

  const next = [...votes];
  next[index] = updated;
  return next;
}

/**
 * 그룹 만남 투표 상태.
 *
 * **브로드캐스트는 실시간 갱신 신호일 뿐이고 진실은 목록 REST다.** STOMP 브로커가
 * 인메모리라 전달 보장이 없어서, VOTE_CREATED/VOTE_CLOSED를 보면 상세를 신뢰하는 대신
 * 목록을 다시 읽는다. 재접속·복귀 시 놓친 프레임도 같은 경로로 메워진다.
 *
 * cast(개별 투표)는 브로드캐스트되지 않는다 — 남의 표는 재조회 시점에 반영되고,
 * 내 표는 cast 응답의 상세로 즉시 갱신된다.
 */
export function useGroupVote(
  roomId: number,
  { messages, enabled }: UseGroupVoteOptions,
): UseGroupVoteResult {
  const [votes, setVotes] = useState<GroupVote[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);
  /** 이미 반영한 투표 SYSTEM 메시지 id. 같은 프레임으로 재조회가 반복되지 않게 막는다. */
  const handledMessageIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !Number.isFinite(roomId)) return;

    try {
      const list = await getRoomVotes(roomId);
      if (!activeRef.current) return;
      setVotes(list);
      setError(null);
    } catch {
      if (!activeRef.current) return;
      setError("투표를 불러오지 못했어요.");
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, [enabled, roomId]);

  // 진입 시 1회. 이후 갱신은 SYSTEM 메시지가 끈다.
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  /**
   * VOTE_CREATED / VOTE_CLOSED 수신 → 목록 재조회.
   * 최초 로드로 들어온 과거 메시지까지 전부 처리한 것으로 표시해 두고, 그 뒤에 새로
   * 도착한 것만 재조회를 트리거한다.
   */
  useEffect(() => {
    if (!enabled) return;

    const unseen = messages.filter(
      (message) =>
        !handledMessageIdsRef.current.has(message.id) && parseVoteSystemMessage(message) !== null,
    );
    if (unseen.length === 0) return;

    const isFirstPass = handledMessageIdsRef.current.size === 0;
    unseen.forEach((message) => handledMessageIdsRef.current.add(message.id));

    // 최초 로드분은 이미 refresh()가 함께 돌고 있으므로 중복 호출하지 않는다.
    if (isFirstPass) return;
    void refresh();
  }, [enabled, messages, refresh]);

  const create = useCallback(
    async (body: CreateGroupVoteRequest) => {
      const created = await createVoteRequest(roomId, body);
      // 선택지 내용(장소 이름·시간)은 싣지 않는다. 개수만으로 충분하다.
      trackEvent("vote_create", {
        option_count: body.placeOptions.length + body.timeOptions.length,
      });
      if (activeRef.current) setVotes((previous) => upsertVote(previous, created));
      return created;
    },
    [roomId],
  );

  const cast = useCallback(
    async (voteId: number, body: CastVoteRequest) => {
      const updated = await castVoteRequest(roomId, voteId, body);
      trackEvent("vote_submit", {});
      if (activeRef.current) setVotes((previous) => upsertVote(previous, updated));
      return updated;
    },
    [roomId],
  );

  const close = useCallback(
    async (voteId: number) => {
      const closed = await closeVoteRequest(roomId, voteId);
      trackEvent("vote_close", {});
      if (activeRef.current) setVotes((previous) => upsertVote(previous, closed));
      return closed;
    },
    [roomId],
  );

  const openVote = useMemo(() => findOpenVote(votes), [votes]);

  const getVoteById = useCallback(
    (voteId: number) => votes.find((vote) => vote.voteId === voteId) ?? null,
    [votes],
  );

  return { votes, openVote, loading, error, getVoteById, refresh, create, cast, close };
}
