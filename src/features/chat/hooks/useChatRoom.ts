"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getChatMessages,
  getChatRooms,
  markChatRoomRead,
  uploadChatImages,
} from "@/features/chat/api/chatApi";
import { createChatSocket, type ChatSocket } from "@/features/chat/lib/chatSocket";
import { deriveRoomState } from "@/features/chat/lib/roomState";
import { CHAT_TEXT_MAX_LENGTH } from "@/features/chat/model/constants";
import type {
  ChatConnectionStatus,
  ChatMessage,
  ChatMessageType,
  ChatOptimisticMessage,
} from "@/features/chat/model/types";
import { getMyMemberId } from "@/shared/lib/auth";

/** 리줌 시 과거로 되짚을 최대 페이지 수. 공백이 이보다 크면 사용자가 위로 스크롤해 채운다. */
const MAX_RESUME_PAGES = 5;

/**
 * 전송한 메시지의 에코를 기다리는 시간.
 *
 * /pub로 보낸 메시지가 서버 검증에 걸리면 ERROR 프레임도 응답도 없이 조용히 사라진다
 * (개방 전·종료된 방, 빈 내용, 1000자 초과, 잘못된 이미지 key). "ERROR가 없으면 성공"으로
 * 보면 만료 직후 보낸 메시지가 영원히 전송 중으로 남으므로, 에코가 이 시간 안에
 * 돌아오지 않으면 실패로 판정하고 방 상태를 다시 읽어 원인을 가린다.
 */
const SEND_ECHO_TIMEOUT_MS = 5000;

type PendingSend = {
  localId: string;
  content: string;
  messageType: ChatOptimisticMessage["messageType"];
  timeoutId: ReturnType<typeof setTimeout>;
};

type UseChatRoomResult = {
  /** 오래된 → 최신 순. 화면에 그대로 쌓으면 된다. */
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingOlder: boolean;
  loadOlder: () => Promise<void>;
  status: ChatConnectionStatus;
  sending: boolean;
  sendText: (content: string) => Promise<void>;
  sendImages: (files: File[]) => Promise<void>;
  optimisticMessages: ChatOptimisticMessage[];
  retrySend: (localId: string) => void;
  /** 방 상태 때문에 실패한 전송의 안내 문구. 표시 후 clearSendError로 비운다. */
  sendError: string | null;
  clearSendError: () => void;
};

type UseChatRoomOptions = {
  optimisticSending?: boolean;
};

/** id 기준 중복 제거 후 오름차순 정렬. STOMP 수신과 REST 리줌이 겹칠 수 있다. */
export function mergeAscending(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;

  const byId = new Map<number, ChatMessage>();
  current.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => byId.set(message.id, message));

  return [...byId.values()].sort((left, right) => left.id - right.id);
}

/**
 * 채팅방 하나의 메시지 상태를 관리한다.
 * 내가 보낸 메시지는 낙관적으로 표시하고, 서버 브로드캐스트 에코로만 성공을 확정한다.
 */
export function useChatRoom(
  roomId: number,
  { optimisticSending = false }: UseChatRoomOptions = {},
): UseChatRoomResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [status, setStatus] = useState<ChatConnectionStatus>("idle");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatOptimisticMessage[]>([]);

  const socketRef = useRef<ChatSocket | null>(null);
  const latestIdRef = useRef<number>(0);
  const lastReadSentRef = useRef<number>(0);
  const pendingSendsRef = useRef<Map<string, PendingSend>>(new Map());
  const optimisticMessagesRef = useRef<ChatOptimisticMessage[]>([]);
  const myMemberIdRef = useRef<number | null>(null);
  const localIdSequenceRef = useRef(0);

  const clearSendError = useCallback(() => setSendError(null), []);

  /**
   * 에코가 오지 않았다. 서버는 이유를 돌려주지 않으므로 방 목록을 다시 읽어 원인을 가른다.
   */
  const diagnoseSendFailure = useCallback(async () => {
    const room = await getChatRooms()
      .then((rooms) => rooms.find((item) => item.roomId === roomId) ?? null)
      .catch(() => null);

    const state = room ? deriveRoomState(room) : null;
    if (state === "ENDED") {
      setSendError("대화가 종료되어 메시지를 보내지 못했어요.");
    } else if (state === "BEFORE_OPEN") {
      setSendError("아직 대화가 열리지 않아 메시지를 보내지 못했어요.");
    } else if (!optimisticSending) {
      setSendError("메시지를 보내지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [optimisticSending, roomId]);

  const updateOptimisticMessages = useCallback(
    (
      update: (messages: ChatOptimisticMessage[]) => ChatOptimisticMessage[],
    ) => {
      setOptimisticMessages((previous) => {
        const next = update(previous);
        optimisticMessagesRef.current = next;
        return next;
      });
    },
    [],
  );

  const clearPendingSend = useCallback((localId: string) => {
    const pending = pendingSendsRef.current.get(localId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingSendsRef.current.delete(localId);
  }, []);

  const markSendFailed = useCallback(
    (localId: string) => {
      const pending = pendingSendsRef.current.get(localId);
      if (pending) clearTimeout(pending.timeoutId);
      updateOptimisticMessages((previous) =>
        previous.map((message) =>
          message.localId === localId ? { ...message, status: "failed" } : message,
        ),
      );
      void diagnoseSendFailure();
    },
    [diagnoseSendFailure, updateOptimisticMessages],
  );

  /** 전송한 메시지를 에코 대기 목록에 올린다. */
  const trackPendingSend = useCallback(
    (message: ChatOptimisticMessage) => {
      clearPendingSend(message.localId);
      const timeoutId = setTimeout(() => {
        markSendFailed(message.localId);
      }, SEND_ECHO_TIMEOUT_MS);

      pendingSendsRef.current.set(message.localId, {
        localId: message.localId,
        content: message.content,
        messageType: message.messageType,
        timeoutId,
      });
    },
    [clearPendingSend, markSendFailed],
  );

  const publishOptimisticMessage = useCallback(
    (message: ChatOptimisticMessage) => {
      updateOptimisticMessages((previous) =>
        previous.map((item) =>
          item.localId === message.localId ? { ...item, status: "sending" } : item,
        ),
      );
      trackPendingSend(message);

      const published = socketRef.current?.publish({
        content: message.content,
        messageType: message.messageType,
      });
      if (!published) markSendFailed(message.localId);
    },
    [markSendFailed, trackPendingSend, updateOptimisticMessages],
  );

  const createOptimisticMessage = useCallback(
    (content: string, messageType: Exclude<ChatMessageType, "SYSTEM">) => {
      localIdSequenceRef.current += 1;
      return {
        localId: `${roomId}-${Date.now()}-${localIdSequenceRef.current}`,
        content,
        messageType,
        createdAt: new Date().toISOString(),
        status: "sending",
      } satisfies ChatOptimisticMessage;
    },
    [roomId],
  );

  const addOptimisticMessage = useCallback(
    (content: string, messageType: Exclude<ChatMessageType, "SYSTEM">) => {
      const message = createOptimisticMessage(content, messageType);

      updateOptimisticMessages((previous) => [...previous, message]);
      publishOptimisticMessage(message);
    },
    [createOptimisticMessage, publishOptimisticMessage, updateOptimisticMessages],
  );

  /** 내가 보낸 메시지가 브로드캐스트로 돌아오면 그 건의 대기를 푼다. */
  const resolvePendingSend = useCallback((incoming: ChatMessage[]) => {
    const myMemberId = myMemberIdRef.current;
    if (myMemberId === null || pendingSendsRef.current.size === 0) return;

    incoming.forEach((message) => {
      if (message.senderId !== myMemberId) return;

      const pending = [...pendingSendsRef.current.values()].find(
        (item) =>
          item.content === message.content && item.messageType === message.messageType,
      );
      if (!pending) return;

      clearPendingSend(pending.localId);
      updateOptimisticMessages((previous) =>
        previous.filter((item) => item.localId !== pending.localId),
      );
    });
  }, [clearPendingSend, updateOptimisticMessages]);

  const applyIncoming = useCallback(
    (incoming: ChatMessage[]) => {
      if (incoming.length === 0) return;
      resolvePendingSend(incoming);
      setMessages((previous) => {
        const merged = mergeAscending(previous, incoming);
        latestIdRef.current = merged.length > 0 ? merged[merged.length - 1].id : 0;
        return merged;
      });
    },
    [resolvePendingSend],
  );

  useEffect(() => {
    myMemberIdRef.current = getMyMemberId();
  }, []);

  // 언마운트 시 남은 에코 타이머를 정리한다.
  useEffect(
    () => () => {
      pendingSendsRef.current.forEach((pending) => clearTimeout(pending.timeoutId));
      pendingSendsRef.current.clear();
    },
    [],
  );

  /**
   * 재연결 직후 공백 메우기.
   * REST 커서는 과거 방향만 지원하므로, 최신 페이지부터 되짚어 내려가며
   * 마지막으로 받은 id에 도달할 때까지 모은다.
   */
  const resumeFrom = useCallback(
    async (lastSeenId: number) => {
      const collected: ChatMessage[] = [];
      let cursor: number | null | undefined = undefined;

      for (let page = 0; page < MAX_RESUME_PAGES; page += 1) {
        const result = await getChatMessages(roomId, cursor);
        collected.push(...result.messages);

        const oldestInPage = result.messages[result.messages.length - 1]?.id;
        // 이미 알고 있는 구간까지 내려왔거나 더 볼 게 없으면 멈춘다.
        if (!result.nextCursor || oldestInPage === undefined || oldestInPage <= lastSeenId) break;
        cursor = result.nextCursor;
      }

      applyIncoming(collected.filter((message) => message.id > lastSeenId));
    },
    [applyIncoming, roomId],
  );

  // 최초 로드
  useEffect(() => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      setError("잘못된 채팅방이에요.");
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getChatMessages(roomId)
      .then((page) => {
        if (!active) return;
        // 응답은 최신 먼저라 역순으로 뒤집어 오름차순으로 만든다.
        const ascending = [...page.messages].reverse();
        setMessages(ascending);
        setNextCursor(page.nextCursor);
        latestIdRef.current = ascending.length > 0 ? ascending[ascending.length - 1].id : 0;
      })
      .catch(() => {
        if (active) setError("메시지를 불러오지 못했어요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  // 실시간 연결
  useEffect(() => {
    if (!Number.isFinite(roomId)) return undefined;

    setStatus("connecting");
    const socket = createChatSocket(roomId, {
      onMessage: (message) => applyIncoming([message]),
      onConnect: () => {
        setStatus("connected");
        // 끊겨 있는 동안 쌓인 메시지를 REST로 메운다. 메시지는 DB에 영속돼 유실이 아니다.
        if (latestIdRef.current > 0) {
          void resumeFrom(latestIdRef.current).catch(() => undefined);
        }
      },
      onDisconnect: () => setStatus("disconnected"),
    });

    socketRef.current = socket;
    socket.activate();

    return () => {
      socketRef.current = null;
      void socket.deactivate();
      setStatus("idle");
    };
  }, [applyIncoming, resumeFrom, roomId]);

  // 읽음 처리 — 새 메시지가 들어올 때마다 마지막 id를 올린다.
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || latest.id <= lastReadSentRef.current) return;

    lastReadSentRef.current = latest.id;
    void markChatRoomRead(roomId, latest.id).catch(() => undefined);
  }, [messages, roomId]);

  const loadOlder = useCallback(async () => {
    if (nextCursor == null || loadingOlder) return;

    setLoadingOlder(true);
    try {
      const page = await getChatMessages(roomId, nextCursor);
      setMessages((previous) => mergeAscending(previous, page.messages));
      setNextCursor(page.nextCursor);
    } catch {
      // 위로 스크롤 실패는 조용히 넘긴다. 다음 스크롤에서 다시 시도된다.
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, nextCursor, roomId]);

  const sendText = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const body = trimmed.slice(0, CHAT_TEXT_MAX_LENGTH);
      if (optimisticSending) {
        addOptimisticMessage(body, "TEXT");
        return;
      }

      const message = createOptimisticMessage(body, "TEXT");
      trackPendingSend(message);
      if (!socketRef.current?.publish({ content: body, messageType: "TEXT" })) {
        clearPendingSend(message.localId);
        throw new Error("연결이 끊겨 메시지를 보내지 못했어요.");
      }
    },
    [
      addOptimisticMessage,
      clearPendingSend,
      createOptimisticMessage,
      optimisticSending,
      trackPendingSend,
    ],
  );

  const sendImages = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setSending(true);
      try {
        // 업로드 URL 발급 → S3 직접 PUT → objectKey만 STOMP로 전송.
        const objectKeys = await uploadChatImages(roomId, files);
        objectKeys.forEach((objectKey) => {
          if (optimisticSending) {
            addOptimisticMessage(objectKey, "IMAGE");
            return;
          }

          const message = createOptimisticMessage(objectKey, "IMAGE");
          trackPendingSend(message);
          if (!socketRef.current?.publish({ content: objectKey, messageType: "IMAGE" })) {
            clearPendingSend(message.localId);
          }
        });
      } finally {
        setSending(false);
      }
    },
    [
      addOptimisticMessage,
      clearPendingSend,
      createOptimisticMessage,
      optimisticSending,
      roomId,
      trackPendingSend,
    ],
  );

  const retrySend = useCallback(
    (localId: string) => {
      const message = optimisticMessagesRef.current.find((item) => item.localId === localId);
      if (!message || message.status !== "failed") return;
      publishOptimisticMessage(message);
    },
    [publishOptimisticMessage],
  );

  return {
    messages,
    loading,
    error,
    hasMore: nextCursor != null,
    loadingOlder,
    loadOlder,
    status,
    sending,
    sendText,
    sendImages,
    optimisticMessages,
    retrySend,
    sendError,
    clearSendError,
  };
}
