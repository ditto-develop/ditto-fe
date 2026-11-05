"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import {
  deriveRoomState,
  getRoomEndedMessage,
  leaveChatRoom,
  summarizeVoteOutcome,
  useChatRoom,
  useChatRoomMeta,
  useGroupVote,
} from "@/features/chat";
import type { CastVoteRequest, CreateGroupVoteRequest, GroupVote } from "@/features/chat";
import {
  CHAT_KEYBOARD_ANIMATION_MS,
  useChatKeyboardInset,
} from "@/features/chat/hooks/useChatKeyboardInset";
import { useSystemPeriod } from "@/features/system/hooks/useSystemPeriod";
import { useRoomQuizDistribution } from "@/features/records/hooks/useRoomQuizAnswers";
import { formatGroupSummary, toRoomQuizMembers } from "@/features/records/lib/roomAnswers";
import { formatSendOpensAt, groupChips } from "@/features/records/lib/roomAnswerText";
import type { QuizDistributionItem } from "@/features/records/model/types";
import { RoomAnswersSummaryBar } from "@/features/records/ui/RoomAnswersSummaryBar";
import {
  RoomAnswersTooltip,
  useGroupAnswersTooltip,
} from "@/features/records/ui/RoomAnswersTooltip";
import { RoomGroupAnswersPage } from "@/features/records/ui/RoomGroupAnswersPage";
import { RoomQuizAttachmentPreview } from "@/features/records/ui/RoomQuizAttachmentPreview";
import { useFeatureFlag } from "@/shared/lib/hooks/useFeatureFlag";
import { useToast } from "@/context/ToastContext";
import { useChatRoomMuteToggle } from "@/features/chat/hooks/useChatRoomMuteToggle";
import { getMyMemberId } from "@/shared/lib/auth";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";
import { ChatRoomSkeleton } from "@/app/chat/_components/ChatRoomSkeleton";
import { ChatImageViewer } from "@/app/chat/_components/ChatImageViewer";
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
import { ChatRateAction } from "@/app/chat/_components/ChatRateAction";
import type { CounterpartProfile } from "@/features/chat";
import type { AddOptionInput } from "@/features/chat/hooks/useGroupVote";

/** 투표 화면은 방 위에 전체 화면으로 덮인다. 어떤 투표를 어느 모드로 볼지의 상태. */
type VoteView = { mode: "submission" | "results"; voteId: number };

/**
 * 마감된 투표 배너 문구. Figma [2232:40174] 는 확정 상태만 그린다 — 동표·무표에서
 * '확정'이라 하면 틀리므로 채팅방 결과 카드(VoteResultMessageBubble)와 같은 구분을 쓴다.
 */
function getClosedVoteLabel(vote: GroupVote): string {
  const outcome = summarizeVoteOutcome(vote);
  if (outcome?.kind === "decided") return "만남 투표 결과가 확정됐어요";
  if (outcome?.kind === "tied") return "만남 투표가 동표로 마감됐어요";
  return "만남 투표가 마감됐어요";
}

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
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CounterpartProfile | null>(null);
  const [isCreateVoteOpen, setIsCreateVoteOpen] = useState(false);
  const [voteView, setVoteView] = useState<VoteView | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  /** 8.1 "우리 그룹의 답변" 화면과, 거기서 골라 입력창 위에 붙인 문항. */
  const [isAnswersOpen, setIsAnswersOpen] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<QuizDistributionItem | null>(null);
  const keyboardInset = useChatKeyboardInset();

  const {
    messages,
    loading: messagesLoading,
    hasMore,
    loadingOlder,
    loadOlder,
    markReadThrough,
    status,
    sendText,
    sendImages,
    sendError,
    clearSendError,
    sendQuizCard,
  } = useChatRoom(roomId, { roomType: "group" });
  const { room, members, memberById, loading: metaLoading, refresh: refreshRoom } =
    useChatRoomMeta(roomId);
  useEffect(() => {
    const memberId = Number(new URLSearchParams(window.location.search).get("member"));
    const member = members.find((item) => item.userId === memberId);
    if (member) setSelectedMember(member);
  }, [members]);

  // 개방 판정의 기준. 어드민 시각 오버라이드가 반영된 서버 기간이다.
  const serverPeriod = useSystemPeriod();
  const { showToast } = useToast();
  const toggleMute = useChatRoomMuteToggle(roomId, room?.isMuted ?? false, refreshRoom);
  /*
   * 8.1 답변 분포(서버 `RECORDS` 플래그). 끝난 방(7004)·서버에 API 가 없음(404)이면 null 이라
   * 요약 바·문서 아이콘·툴팁이 모두 빠지고 방은 예전 그대로다. 첫 대화 힌트(QUIZ_HINT)는 메시지라
   * 플래그와 상관없이 목록에 그려진다.
   */
  const recordsEnabled = useFeatureFlag("RECORDS");
  const [roomEndedForQuiz, setRoomEndedForQuiz] = useState(false);
  const {
    data: quizDistribution,
    markSent,
    refetch: refetchQuizDistribution,
  } = useRoomQuizDistribution(roomId, recordsEnabled && !roomEndedForQuiz);
  // 분포는 남아 있는 멤버 기준 실시간이다 — 누가 나가거나(MEMBER_LEFT) 늦게 들어오면 다시 읽는다.
  const memberCount = members.length;
  const previousMemberCountRef = useRef(memberCount);
  useEffect(() => {
    if (previousMemberCountRef.current === memberCount) return;
    previousMemberCountRef.current = memberCount;
    refetchQuizDistribution();
  }, [memberCount, refetchQuizDistribution]);
  const answersTooltip = useGroupAnswersTooltip();

  /** 문서 아이콘을 누르면 툴팁도 다시 안 뜬다(Figma 주석 3269:34323). */
  const openAnswers = () => {
    answersTooltip.dismiss();
    setIsAnswersOpen(true);
  };

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
  // 방이 끝나면 답변 보기도 닫힌다(서버도 7004 로 막는다). 끝나는 순간 다시 묻지 않고 숨긴다.
  useEffect(() => {
    if (isEnded) setRoomEndedForQuiz(true);
  }, [isEnded]);
  const quizAnswers = isEnded ? null : quizDistribution;
  const expiresAt = useMemo(() => parseServerDateTime(room?.expiresAt), [room?.expiresAt]);

  const memberNames = members.map((member) => member.nickname);
  // counterpartMemberIds는 나를 뺀 인원이다. 표시용 총원에는 나를 더한다.
  const totalMembers = members.length + 1;

  // 투표는 그룹 방에만 있다. 다른 유형에 호출하면 서버가 8208로 거절한다.
  const {
    votes,
    openVote,
    getVoteById,
    create: createVote,
    cast: castVote,
    addOption: addVoteOption,
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

  const latestClosedVote = votes.find((vote) => vote.status === "CLOSED");
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
    await createVote(payload);
    setIsCreateVoteOpen(false);
    setVoteView(null);
    showToast("투표를 만들었어요.", "default");
  };

  /**
   * 진행 중 투표에 선택지 추가. 응답이 갱신된 상세라 훅이 그대로 갈아끼우므로
   * 화면은 다시 열 필요 없이 새 선택지가 붙는다.
   */
  const handleAddVoteOption = async (option: AddOptionInput) => {
    if (!voteView) return;
    await addVoteOption(voteView.voteId, option);
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

  /**
   * 질문 카드를 보낸다(STOMP 프레임 하나). 실패하면 ChatInput 이 그 문구로 토스트를 띄우고 입력값을 남긴다.
   * 이미 올라온 문항이면(7007 — 다른 멤버가 먼저 올렸을 수 있다) 한마디는 서버가 저장했으므로 담긴
   * 문항을 비우고 안내만 한다.
   */
  const handleShareQuiz = async (content: string) => {
    if (!pendingQuiz) return;
    const quizId = pendingQuiz.quizId;
    const result = await sendQuizCard(quizId, content);
    markSent(quizId);
    setPendingQuiz(null);
    if (result === "duplicate") showToast("이미 올라온 질문이에요.", "error");
  };

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveChatRoom(roomId);
      // 열린 방에서 나가면 서버가 응답 전에 나간 사람의 평가를 연다(남은 인원 미달로 해체돼도
      // 전원 평가가 열린다). 개방 전 방은 방이 끝날 때 열리므로 목록으로 간다. 나간 방은 서버가
      // 목록에서 빼므로 평가 화면은 방 목록이 아니라 평가 목록으로 찾는다(2026-10-04 QA).
      // 판정은 방 상태(roomState)로 한다 — 이 파일의 `status`는 웹소켓 연결 상태다.
      router.replace(room && roomState === "OPEN" ? `/chat/group/${roomId}/rate` : "/chat");
    } catch {
      showToast("대화방을 나가지 못했어요. 잠시 후 다시 시도해주세요.", "error");
      setLeaving(false);
    }
  };

  if (metaLoading || messagesLoading) {
    return (
      <PageContainer>
        <ChatRoomSkeleton />
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

  const answersSummary = quizAnswers ? formatGroupSummary(quizAnswers) : null;
  const quizShare = {
    canSend: (quizAnswers?.canSendCard ?? false) && roomState === "OPEN" && !hasLeft,
    // 열린 방인데 못 보내면 서버 QUIZ_CHAT 플래그가 꺼졌거나 내가 나간 방이다.
    lockedMessage:
      roomState === "BEFORE_OPEN" && quizAnswers
        ? formatSendOpensAt(quizAnswers.chatOpensAt)
        : "지금은 질문을 보낼 수 없어요",
  };

  return (
    <PageContainer $keyboardInset={keyboardInset} data-cy="chat-room">
      <GroupChatRoomHeader
        roomName={room.roomName}
        memberNames={memberNames}
        totalMembers={totalMembers}
        expiresAt={isEnded ? null : expiresAt}
        onMenuClick={() => setIsMenuOpen(true)}
        onAnswersClick={quizAnswers ? openAnswers : undefined}
        answersTooltip={
          quizAnswers && answersTooltip.visible ? (
            <RoomAnswersTooltip onClose={answersTooltip.dismiss} />
          ) : null
        }
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

      {/*
        8.1 진행 중 투표가 없으면 그 자리에 "우리의 답변" 요약 바를 띄운다(Figma 주석 3270:36279
        "조건에 따라 노출 배너 차이" — 진행 중 3270:36243 / 미진행 3270:36278). 마감된 투표
        배너는 요약 바가 없을 때(`RECORDS` 플래그가 꺼져 있거나 방 답변을 못 읽음)만 그대로 뜬다.
      */}
      {!openVote && answersSummary && (
        <RoomAnswersSummaryBar
          label={answersSummary}
          tone="dark"
          onOpen={openAnswers}
        />
      )}

      {!openVote && !answersSummary && latestClosedVote && (
        <VoteBanner
          label={getClosedVoteLabel(latestClosedVote)}
          buttonLabel="확인하기"
          onVoteClick={() => openVoteView(latestClosedVote.voteId)}
        />
      )}

      <GroupMessageList
        messages={messages}
        myUserId={myUserId}
        memberById={memberById}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        onVisibleMessage={markReadThrough}
        notice={notice}
        onImageClick={setViewerImageUrl}
        getVoteById={getVoteById}
        onVoteClick={openVoteView}
        onSenderClick={setSelectedMember}
        quizDistribution={quizAnswers}
      />

      {/* 나간 방은 읽기 전용이다. 입력창도 평가 버튼도 띄우지 않는다. */}
      {!isEnded && !hasLeft && (
        <ChatInput
          onSend={sendText}
          onSendImages={sendImages}
          disabled={roomState !== "OPEN"}
          quizAttachment={
            pendingQuiz
              ? {
                  preview: (
                    <RoomQuizAttachmentPreview
                      order={pendingQuiz.order}
                      question={pendingQuiz.question}
                      chips={groupChips(pendingQuiz.choices, pendingQuiz.myChoiceId)}
                      onRemove={() => setPendingQuiz(null)}
                    />
                  ),
                  onSend: handleShareQuiz,
                }
              : null
          }
        />
      )}

      {isEnded && !hasLeft && (
        <ChatRateAction roomId={roomId} matchType="GROUP" reviewStatus={room?.reviewStatus ?? null} />
      )}

      {isMenuOpen && (
        <GroupChatMenuBottomSheet
          // 방당 열린 투표는 하나뿐이다. 진행 중이면 만들기를 숨긴다(만들면 8202).
          canCreateVote={roomState === "OPEN" && !hasLeft && openVote === null}
          onCreateVote={() => setIsCreateVoteOpen(true)}
          onClose={() => setIsMenuOpen(false)}
          onMemberList={() => setIsMemberListOpen(true)}
          onLeave={isEnded || hasLeft ? undefined : () => setIsLeaveModalOpen(true)}
          // 끝났거나 나간 방에는 더 올 채팅 알림이 없다(나간 방은 서버도 7001/7002 로 거절).
          isMuted={room?.isMuted ?? false}
          onToggleMute={isEnded || hasLeft || !room ? undefined : toggleMute}
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
          onAddOption={handleAddVoteOption}
        />
      )}

      {voteView?.mode === "results" && activeVote && (
        <VoteResultsPage
          vote={activeVote}
          memberNameById={memberNameById}
          onClose={() => setVoteView(null)}
          onRevote={() => setVoteView({ mode: "submission", voteId: activeVote.voteId })}
          onCloseVote={handleCloseVote}
          canCloseVote={myUserId !== null && activeVote.createdBy === myUserId}
        />
      )}

      <ChatImageViewer imageUrl={viewerImageUrl} onClose={() => setViewerImageUrl(null)} />

      {isAnswersOpen && quizAnswers && (
        <RoomGroupAnswersPage
          data={quizAnswers}
          members={toRoomQuizMembers(myUserId, members)}
          share={quizShare}
          onClose={() => setIsAnswersOpen(false)}
          onShare={(item) => {
            setPendingQuiz(item);
            setIsAnswersOpen(false);
          }}
          onLockedTap={(message) => showToast(message, "info")}
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
          onClose={() => {
            setSelectedMember(null);
            if (new URLSearchParams(window.location.search).has("member")) {
              router.replace(window.location.pathname, { scroll: false });
            }
          }}
        />
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div<{ $keyboardInset?: number }>`
  display: flex;
  flex-direction: column;
  height: ${({ $keyboardInset = 0 }) => `calc(100dvh - ${$keyboardInset}px)`};
  width: 100%;
  --chat-input-bottom-padding: ${({ $keyboardInset = 0 }) =>
    $keyboardInset > 0
      ? "var(--space-4)"
      : "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))"};
  background-color: var(--color-semantic-background-normal-normal);
  overflow: hidden;
  transition: height ${CHAT_KEYBOARD_ANIMATION_MS}ms ease-out;
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

