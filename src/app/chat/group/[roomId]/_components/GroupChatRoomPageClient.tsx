"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import {
  deriveRoomState,
  getRoomEndedMessage,
  leaveChatRoom,
  useChatRoom,
  useChatRoomMeta,
  useGroupVote,
} from "@/features/chat";
import type { CastVoteRequest, CreateGroupVoteRequest } from "@/features/chat";
import { useSystemPeriod } from "@/features/system/hooks/useSystemPeriod";
import { useToast } from "@/context/ToastContext";
import { getMyMemberId } from "@/shared/lib/auth";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";
import { GroupChatRoomHeader } from "./GroupChatRoomHeader";
import { GroupMessageList } from "./GroupMessageList";
import { GroupChatMenuBottomSheet } from "./GroupChatMenuBottomSheet";
import { GroupMemberListPage } from "./GroupMemberListPage";
import { GroupMemberProfilePage } from "./GroupMemberProfilePage";
import { ChatInput } from "@/app/chat/one-on-one/[roomId]/_components/ChatInput";
import { ChatLeaveModal } from "@/app/chat/one-on-one/[roomId]/_components/ChatLeaveModal";
import { GroupVoteCreateModal } from "./GroupVoteCreateModal";
import { VoteBanner } from "./VoteBanner";
import { VoteResultsPage } from "./VoteResultsPage";
import { VoteSubmissionPage } from "./VoteSubmissionPage";
import { BottomActionArea, Button } from "@/shared/ui";
import type { CounterpartProfile } from "@/features/chat";

/** 투표 화면은 방 위에 전체 화면으로 덮인다. 어떤 투표를 어느 모드로 볼지의 상태. */
type VoteView = { mode: "submission" | "results"; voteId: number };

/**
 * 그룹 채팅방.
 *
 * 그룹 방은 정원이 차면 서버가 자동 생성하고, 1:1·재매칭과 **같은** `/api/v1/chat/rooms`
 * 계약을 쓴다(메시지 조회·읽음·이미지·STOMP 경로 모두 동일). 별도 group-rooms 엔드포인트는
 * 존재하지 않으므로 1:1과 같은 훅을 그대로 재사용한다.
 *
 * 종료 경로가 1:1과 다르다 — `end`는 그룹에서 막히고(7002), 대신 `leave`로 나만 빠진다.
 * 잔여 1명이 되는 순간 서버가 방을 해체한다(INSUFFICIENT_MEMBERS).
 *
 * 만남 투표는 그룹 전용이며 별도 STOMP destination이 없다. 방 토픽으로 오는
 * `VOTE_CREATED:{id}` / `VOTE_CLOSED:{id}` SYSTEM 메시지가 실시간 신호이고,
 * 진실은 투표 목록 REST다(useGroupVote).
 */
export function GroupChatRoomPageClient() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();

  const [roomId] = useState(() => Number(resolveStaticRouteParam("group", String(params.roomId))));
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CounterpartProfile | null>(null);
  const [isCreateVoteOpen, setIsCreateVoteOpen] = useState(false);
  const [voteView, setVoteView] = useState<VoteView | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const {
    messages,
    loading: messagesLoading,
    hasMore,
    loadingOlder,
    loadOlder,
    status,
    sendText,
    sendImages,
    sendError,
    clearSendError,
  } = useChatRoom(roomId);
  const { room, members, memberById, loading: metaLoading, refresh: refreshRoom } =
    useChatRoomMeta(roomId);
  // 개방 판정의 기준. 어드민 시각 오버라이드가 반영된 서버 기간이다.
  const serverPeriod = useSystemPeriod();
  const { showToast } = useToast();

  useEffect(() => {
    setMyUserId(getMyMemberId());
  }, []);

  // 에코가 오지 않은 전송은 실패다. 원인을 알리고 방 상태를 다시 읽는다.
  useEffect(() => {
    if (!sendError) return;

    showToast(sendError, "error");
    clearSendError();
    void refreshRoom();
  }, [sendError, clearSendError, showToast, refreshRoom]);

  const roomState = room ? deriveRoomState(room, undefined, serverPeriod) : "OPEN";
  const isEnded = roomState === "ENDED";
  const hasLeft = room?.hasLeft ?? false;
  const expiresAt = useMemo(() => parseServerDateTime(room?.expiresAt), [room?.expiresAt]);

  const memberNames = members.map((member) => member.nickname);
  // counterpartMemberIds는 나를 뺀 인원이다. 표시용 총원에는 나를 더한다.
  const totalMembers = members.length + 1;

  // 투표는 그룹 방에만 있다. 다른 유형에 호출하면 서버가 8208로 거절한다.
  const {
    openVote,
    getVoteById,
    create: createVote,
    cast: castVote,
    close: closeVote,
  } = useGroupVote(roomId, {
    messages,
    enabled: room?.sourceType === "GROUP",
  });

  /** 결과 화면의 voterIds(회원 ID) → 표시 이름. 내 표는 '나'로 보여준다. */
  const memberNameById = useMemo(() => {
    const names = new Map<number, string>();
    members.forEach((member) => names.set(member.userId, member.nickname));
    if (myUserId !== null) names.set(myUserId, "나");
    return names;
  }, [members, myUserId]);

  const activeVote = voteView ? getVoteById(voteView.voteId) : null;

  /** 아직 안 던졌으면 제출 화면, 던졌으면 결과 화면으로 연다. */
  const openVoteView = useCallback(
    (voteId: number) => {
      const vote = getVoteById(voteId);
      const mode = vote && vote.status === "OPEN" && vote.myVote === null ? "submission" : "results";
      setVoteView({ mode, voteId });
    },
    [getVoteById],
  );

  const handleCreateVote = async (payload: CreateGroupVoteRequest) => {
    const created = await createVote(payload);
    setIsCreateVoteOpen(false);
    // 만든 사람은 아직 표를 던지지 않았다 — 바로 제출 화면으로 이어 준다.
    setVoteView({ mode: "submission", voteId: created.voteId });
  };

  const handleCastVote = async (body: CastVoteRequest) => {
    if (!voteView) return;
    await castVote(voteView.voteId, body);
    setVoteView({ mode: "results", voteId: voteView.voteId });
  };

  const handleCloseVote = async () => {
    if (!voteView) return;
    try {
      await closeVote(voteView.voteId);
    } catch {
      showToast("투표를 마감하지 못했어요. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveChatRoom(roomId);
      // 나간 뒤에도 방은 읽기 전용으로 목록에 남는다. 목록에서 다시 읽게 한다.
      router.replace("/chat");
    } catch {
      showToast("대화방을 나가지 못했어요. 잠시 후 다시 시도해주세요.", "error");
      setLeaving(false);
    }
  };

  if (metaLoading || messagesLoading) {
    return (
      <PageContainer>
        <EmptyMessage>불러오는 중...</EmptyMessage>
      </PageContainer>
    );
  }

  if (!room) {
    return (
      <PageContainer>
        <EmptyMessage>채팅방을 찾을 수 없어요.</EmptyMessage>
      </PageContainer>
    );
  }

  const notice = isEnded
    ? getRoomEndedMessage(room)
    : roomState === "BEFORE_OPEN"
      ? "금요일에 대화가 열려요. 그때 다시 만나요!"
      : status === "disconnected"
        ? "연결이 끊겼어요. 다시 연결되면 놓친 메시지를 불러올게요."
        : undefined;

  return (
    <PageContainer>
      <GroupChatRoomHeader
        memberNames={memberNames}
        totalMembers={totalMembers}
        expiresAt={isEnded ? null : expiresAt}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {openVote && (
        <VoteBanner
          label={
            openVote.myVote === null
              ? "만남 투표 진행 중"
              : `만남 투표 진행 중 · ${openVote.votedCount}/${openVote.totalMembers}명 참여`
          }
          onVoteClick={() => openVoteView(openVote.voteId)}
        />
      )}

      <GroupMessageList
        messages={messages}
        myUserId={myUserId}
        memberById={memberById}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        notice={notice}
        onImageClick={(imageUrl) => window.open(imageUrl, "_blank", "noopener,noreferrer")}
        getVoteById={getVoteById}
        onVoteClick={openVoteView}
      />

      {/* 나간 방은 읽기 전용이다. 입력창도 평가 버튼도 띄우지 않는다. */}
      {!isEnded && !hasLeft && (
        <ChatInput
          onSend={sendText}
          onSendImages={sendImages}
          disabled={roomState !== "OPEN"}
        />
      )}

      {isEnded && !hasLeft && (
        <BottomActionArea>
          <RateButton
            type="button"
            $size="large"
            onClick={() => router.push(`/chat/group/${roomId}/rate`)}
          >
            평가하기
          </RateButton>
        </BottomActionArea>
      )}

      {isMenuOpen && (
        <GroupChatMenuBottomSheet
          // 방당 열린 투표는 하나뿐이다. 진행 중이면 만들기를 숨긴다(만들면 8202).
          canCreateVote={roomState === "OPEN" && !hasLeft && openVote === null}
          onCreateVote={() => setIsCreateVoteOpen(true)}
          onClose={() => setIsMenuOpen(false)}
          onMemberList={() => setIsMemberListOpen(true)}
          onReport={() => showToast("그룹 채팅 신고는 멤버 목록에서 상대를 선택해 주세요.", "info")}
          onLeave={isEnded || hasLeft ? undefined : () => setIsLeaveModalOpen(true)}
        />
      )}

      {isCreateVoteOpen && (
        <GroupVoteCreateModal
          onClose={() => setIsCreateVoteOpen(false)}
          onComplete={handleCreateVote}
        />
      )}

      {voteView?.mode === "submission" && activeVote && (
        <VoteSubmissionPage
          vote={activeVote}
          onClose={() => setVoteView(null)}
          onSubmit={handleCastVote}
        />
      )}

      {voteView?.mode === "results" && activeVote && (
        <VoteResultsPage
          vote={activeVote}
          memberNameById={memberNameById}
          onClose={() => setVoteView(null)}
          onRevote={() => setVoteView({ mode: "submission", voteId: activeVote.voteId })}
          onCloseVote={handleCloseVote}
        />
      )}

      <ChatLeaveModal
        isOpen={isLeaveModalOpen}
        title="정말 대화방을 나가시겠어요?"
        message="나가면 대화 내용을 볼 수만 있고 메시지를 보낼 수 없어요."
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeave}
      />

      {isMemberListOpen && (
        <GroupMemberListPage
          members={members}
          onClose={() => setIsMemberListOpen(false)}
          onMemberClick={(member) => setSelectedMember(member)}
        />
      )}

      {selectedMember && (
        <GroupMemberProfilePage
          userId={String(selectedMember.userId)}
          nickname={selectedMember.nickname}
          profileImageUrl={selectedMember.profileImageUrl}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
  overflow: hidden;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
`;

const RateButton = styled(Button)`
  width: 100%;
`;
