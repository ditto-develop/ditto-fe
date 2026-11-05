"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";

import {
  deriveRoomState,
  endChatRoom,
  getRoomEndedMessage,
  isRoomEndedSystemMessage,
  useChatRoom,
  useChatRoomMeta,
} from "@/features/chat";
import type { ChatRoomState } from "@/features/chat";
import {
  CHAT_KEYBOARD_ANIMATION_MS,
  useChatKeyboardInset,
} from "@/features/chat/hooks/useChatKeyboardInset";
import { useChatRoomMuteToggle } from "@/features/chat/hooks/useChatRoomMuteToggle";
import { useSystemPeriod } from "@/features/system/hooks/useSystemPeriod";
import { useRoomQuizCompare } from "@/features/records/hooks/useRoomQuizAnswers";
import { formatPairSummary, toRoomQuizMembers } from "@/features/records/lib/roomAnswers";
import { formatSendOpensAt, pairChips } from "@/features/records/lib/roomAnswerText";
import type { QuizCompareItem } from "@/features/records/model/types";
import { RoomAnswersSummaryBar } from "@/features/records/ui/RoomAnswersSummaryBar";
import { RoomOneOnOneAnswersPage } from "@/features/records/ui/RoomOneOnOneAnswersPage";
import { RoomQuizAttachmentPreview } from "@/features/records/ui/RoomQuizAttachmentPreview";
import { useFeatureFlag } from "@/shared/lib/hooks/useFeatureFlag";
import { useToast } from "@/context/ToastContext";
import { getMyMemberId } from "@/shared/lib/auth";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";
import { ChatRoomSkeleton } from "@/app/chat/_components/ChatRoomSkeleton";
import { ChatImageViewer } from "@/app/chat/_components/ChatImageViewer";
import { ChatRoomHeader } from "./ChatRoomHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatLeaveModal } from "./ChatLeaveModal";
import { ChatMenuBottomSheet } from "./ChatMenuBottomSheet";
import { ChatStatusBanner } from "./ChatStatusBanner";
import { useTimer } from "./useTimer";
import { ChatRateAction } from "@/app/chat/_components/ChatRateAction";
import { GroupMemberProfilePage } from "@/app/chat/group/[roomId]/_components/GroupMemberProfilePage";

const URGENT_NOTICE_MESSAGE =
  "대화가 1시간 후 종료돼요. 아직 하고 싶은 말이 있다면 지금 전해보세요!";

export function ChatRoomPageClient() {
  const params = useParams();
  const router = useRouter();

  const [roomId] = useState(() =>
    Number(resolveStaticRouteParam("one-on-one", String(params.roomId))),
  );
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [isUrgentNoticeDismissed, setIsUrgentNoticeDismissed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  /** 8.1 "우리의 답변" 화면과, 거기서 골라 입력창 위에 붙인 문항. */
  const [isAnswersOpen, setIsAnswersOpen] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<QuizCompareItem | null>(null);

  const {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    loadOlder,
    markReadThrough,
    status,
    sendText,
    sendImages,
    optimisticMessages,
    retrySend,
    sendError,
    clearSendError,
    sendQuizCard,
  } = useChatRoom(roomId, { optimisticSending: true, roomType: "one_on_one" });
  const { room, members, refresh: refreshRoom } = useChatRoomMeta(roomId);
  // 개방 판정의 기준. 어드민 시각 오버라이드가 반영된 서버 기간이다.
  const serverPeriod = useSystemPeriod();
  const { showToast } = useToast();
  const keyboardInset = useChatKeyboardInset();
  /*
   * 8.1 답변 비교(서버 `RECORDS` 플래그). 끝난 방(7004)·상대 탈퇴/차단(7008)·서버에 API 가 없음(404)이면
   * null 이라 요약 바·문서 아이콘이 모두 빠지고 방은 예전 그대로다. 첫 대화 힌트(QUIZ_HINT)는 메시지라
   * 플래그와 상관없이 목록에 그려진다.
   */
  const recordsEnabled = useFeatureFlag("RECORDS");
  const [roomEndedForQuiz, setRoomEndedForQuiz] = useState(false);
  const { data: quizCompare, markSent } = useRoomQuizCompare(
    roomId,
    recordsEnabled && !roomEndedForQuiz,
  );

  const counterpart = members[0] ?? null;

  // 신고 화면에서 돌아오면(`?member=`) 보던 상대 프로필을 다시 연다. 그룹 방과 같은 규칙이다.
  useEffect(() => {
    const memberId = Number(new URLSearchParams(window.location.search).get("member"));
    if (counterpart && counterpart.userId === memberId) setIsProfileOpen(true);
  }, [counterpart]);
  const toggleMute = useChatRoomMuteToggle(roomId, room?.isMuted ?? false, refreshRoom);

  // 에코가 오지 않은 전송은 실패다. 원인을 알린 뒤 방 상태도 다시 읽어 화면을 맞춘다.
  useEffect(() => {
    if (!sendError) return;

    showToast(sendError, "error");
    clearSendError();
    void refreshRoom();
  }, [sendError, clearSendError, showToast, refreshRoom]);

  useEffect(() => {
    setMyUserId(getMyMemberId());
  }, []);

  /**
   * 상대가 종료하면 SYSTEM 메시지가 실시간으로 들어온다. 만료에는 아무 이벤트도 없으므로
   * expiresAt은 deriveRoomState가 시각으로 판정한다.
   */
  const endedBySystemMessage = useMemo(
    () => messages.some(isRoomEndedSystemMessage),
    [messages],
  );

  // 방 메타를 아직 못 읽었으면 막지 않는다(기존 동작 유지). 전송 실패는 에코 판정이 잡는다.
  const roomState: ChatRoomState = !room
    ? "OPEN"
    : endedBySystemMessage
      ? "ENDED"
      : deriveRoomState(room, undefined, serverPeriod);
  const isEnded = roomState === "ENDED";
  // 방이 끝나면 답변 비교도 닫힌다(서버도 7004 로 막는다). 끝나는 순간 다시 묻지 않고 숨긴다.
  useEffect(() => {
    if (isEnded) setRoomEndedForQuiz(true);
  }, [isEnded]);
  const expiresAt = useMemo(() => parseServerDateTime(room?.expiresAt), [room?.expiresAt]);
  const timer = useTimer(expiresAt, isEnded);
  const urgentNoticeStorageKey = `chat-room-${roomId}-urgent-notice-dismissed`;

  useEffect(() => {
    setIsUrgentNoticeDismissed(sessionStorage.getItem(urgentNoticeStorageKey) === "true");
  }, [urgentNoticeStorageKey]);

  const dismissUrgentNotice = () => {
    sessionStorage.setItem(urgentNoticeStorageKey, "true");
    setIsUrgentNoticeDismissed(true);
  };

  /**
   * 질문 카드를 보낸다(STOMP 프레임 하나 — 카드와 한마디의 순서는 서버가 정한다). 실패하면 ChatInput 이
   * 그 문구로 토스트를 띄우고 입력값·담긴 문항을 남긴다. 이미 올라온 문항이면(7007) 한마디는 서버가
   * 저장했으므로 담긴 문항을 비우고 안내만 한다.
   */
  const handleShareQuiz = async (content: string) => {
    if (!pendingQuiz) return;
    const quizId = pendingQuiz.quizId;
    const result = await sendQuizCard(quizId, content);
    markSent(quizId);
    setPendingQuiz(null);
    if (result === "duplicate") showToast("이미 올라온 질문이에요.", "error");
  };

  const handleEndChat = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await endChatRoom(roomId);
      // 서버는 종료 요청 안에서 이 방의 평가를 연다. 나가자마자 평가할 수 있게 평가 화면으로
      // 바로 보낸다(2026-10-04 QA). 평가 화면의 뒤로가기는 방 대신 목록으로 간다 — replace 다.
      // 재매칭 방은 평가가 없다(서버 REVIEWABLE_MATCH_TYPES = PERSONAL·GROUP). 평가 화면으로
      // 보내면 "열리지 않은 평가"만 뜨므로 목록으로 보낸다.
      router.replace(
        room?.sourceType === "REMATCH" ? "/chat" : `/chat/one-on-one/${roomId}/rate`,
      );
    } catch {
      showToast("대화를 종료하지 못했어요. 잠시 후 다시 시도해주세요.", "error");
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ChatRoomSkeleton />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <EmptyMessage>{error}</EmptyMessage>
      </PageContainer>
    );
  }

  const partnerNickname = counterpart?.nickname ?? "상대방";

  const endedMessage = getRoomEndedMessage({
    endedReason: endedBySystemMessage ? "USER_ENDED" : (room?.endedReason ?? null),
  });
  const notice =
    roomState === "BEFORE_OPEN"
      ? "금요일에 대화가 열려요. 그때 다시 만나요!"
      : status === "disconnected"
        ? "연결이 끊겼어요. 다시 연결되면 놓친 메시지를 불러올게요."
        : null;
  const showUrgentNotice =
    !isEnded && timer.isUrgent && !timer.isExpired && !isUrgentNoticeDismissed;
  const quizAnswers = isEnded ? null : quizCompare;
  const quizShare = {
    canSend: (quizAnswers?.canSendCard ?? false) && roomState === "OPEN",
    // 열린 방인데 못 보내면 서버 QUIZ_CHAT 플래그가 꺼진 것이다 — 열리는 시각을 안내하면 틀린다.
    lockedMessage:
      roomState === "BEFORE_OPEN" && quizAnswers
        ? formatSendOpensAt(quizAnswers.chatOpensAt)
        : "지금은 질문을 보낼 수 없어요",
  };

  return (
    <PageContainer $keyboardInset={keyboardInset} data-cy="chat-room">
      <ChatRoomHeader
        roomId={String(roomId)}
        partnerNickname={partnerNickname}
        expiresAt={expiresAt}
        isEnded={isEnded}
        onMenuClick={() => setIsMenuOpen(true)}
        onAnswersClick={quizAnswers ? () => setIsAnswersOpen(true) : undefined}
      />

      {quizAnswers && (
        <RoomAnswersSummaryBar
          label={formatPairSummary(quizAnswers)}
          tone="light"
          onOpen={() => setIsAnswersOpen(true)}
        />
      )}

      {isEnded && (
        <ChatStatusBanner message={endedMessage} showWarningIcon />
      )}

      <MessageList
        messages={messages}
        optimisticMessages={optimisticMessages}
        myUserId={myUserId}
        partnerAvatarUrl={counterpart?.profileImageUrl ?? null}
        partnerNickname={partnerNickname}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        onVisibleMessage={markReadThrough}
        notice={notice}
        onRetrySend={retrySend}
        onImageClick={setViewerImageUrl}
        onPartnerClick={counterpart ? () => setIsProfileOpen(true) : undefined}
        quizOrderOf={(quizId) =>
          quizAnswers?.items.find((item) => item.quizId === quizId)?.order ?? null
        }
      />

      {!isEnded && (
        <>
          {showUrgentNotice && (
            <ChatStatusBanner
              message={URGENT_NOTICE_MESSAGE}
              action={{ actionLabel: "확인", onAction: dismissUrgentNotice }}
            />
          )}
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
                        chips={pairChips(pendingQuiz, partnerNickname)}
                        onRemove={() => setPendingQuiz(null)}
                      />
                    ),
                    onSend: handleShareQuiz,
                  }
                : null
            }
          />
        </>
      )}

      {isEnded && (
        <ChatRateAction roomId={roomId} matchType="PERSONAL" reviewStatus={room?.reviewStatus ?? null} />
      )}

      {isMenuOpen && (
        <ChatMenuBottomSheet
          onClose={() => setIsMenuOpen(false)}
          // 이미 끝난 방은 종료할 게 없다. 신고는 종료 후에도 열어 둔다.
          onLeave={isEnded ? undefined : () => setIsLeaveModalOpen(true)}
          // 끝난 방에는 더 올 채팅 알림이 없다.
          isMuted={room?.isMuted ?? false}
          onToggleMute={isEnded || !room ? undefined : toggleMute}
          onReport={() =>
            counterpart &&
            router.push(`/report?userId=${counterpart.userId}&source=chat-room`)
          }
        />
      )}

      <ChatImageViewer imageUrl={viewerImageUrl} onClose={() => setViewerImageUrl(null)} />

      {isAnswersOpen && quizAnswers && (
        <RoomOneOnOneAnswersPage
          data={quizAnswers}
          members={toRoomQuizMembers(myUserId, counterpart ? [counterpart] : [])}
          partnerName={partnerNickname}
          share={quizShare}
          onClose={() => setIsAnswersOpen(false)}
          onShare={(item) => {
            setPendingQuiz(item);
            setIsAnswersOpen(false);
          }}
          onLockedTap={(message) => showToast(message, "info")}
        />
      )}

      {isProfileOpen && counterpart && (
        <GroupMemberProfilePage
          userId={String(counterpart.userId)}
          nickname={counterpart.nickname}
          profileImageUrl={counterpart.profileImageUrl}
          onClose={() => {
            setIsProfileOpen(false);
            if (new URLSearchParams(window.location.search).has("member")) {
              router.replace(window.location.pathname, { scroll: false });
            }
          }}
        />
      )}

      <ChatLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleEndChat}
      />
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

