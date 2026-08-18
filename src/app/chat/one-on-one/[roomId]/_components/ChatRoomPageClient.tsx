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
import { useToast } from "@/context/ToastContext";
import { getMyMemberId } from "@/shared/lib/auth";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";
import { ChatRoomHeader } from "./ChatRoomHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatLeaveModal } from "./ChatLeaveModal";
import { ChatMenuBottomSheet } from "./ChatMenuBottomSheet";
import { ChatStatusBanner } from "./ChatStatusBanner";
import { useTimer } from "./useTimer";
import { BottomActionArea, Button } from "@/shared/ui";

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
  const [ending, setEnding] = useState(false);
  const [isUrgentNoticeDismissed, setIsUrgentNoticeDismissed] = useState(false);

  const {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    loadOlder,
    status,
    sendText,
    sendImages,
    optimisticMessages,
    retrySend,
    sendError,
    clearSendError,
  } = useChatRoom(roomId, { optimisticSending: true });
  const { room, members, refresh: refreshRoom } = useChatRoomMeta(roomId);
  const { showToast } = useToast();

  const counterpart = members[0] ?? null;

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
      : deriveRoomState(room);
  const isEnded = roomState === "ENDED";
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

  const handleEndChat = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await endChatRoom(roomId);
      // 응답 data가 비어 있어 서버 응답만으로는 알 수 있는 게 없다. 목록으로 돌아가 다시 읽는다.
      router.replace("/chat");
    } catch {
      showToast("대화를 종료하지 못했어요. 잠시 후 다시 시도해주세요.", "error");
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <EmptyMessage>불러오는 중...</EmptyMessage>
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

  return (
    <PageContainer>
      <ChatRoomHeader
        roomId={String(roomId)}
        partnerNickname={partnerNickname}
        expiresAt={expiresAt}
        isEnded={isEnded}
        onMenuClick={() => setIsMenuOpen(true)}
      />

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
        notice={notice}
        onRetrySend={retrySend}
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
          />
        </>
      )}

      {isEnded && (
        <BottomActionArea>
          <RateButton
            type="button"
            $size="large"
            onClick={() => router.push(`/chat/one-on-one/${roomId}/rate`)}
          >
            평가하기
          </RateButton>
        </BottomActionArea>
      )}

      {isMenuOpen && (
        <ChatMenuBottomSheet
          onClose={() => setIsMenuOpen(false)}
          // 이미 끝난 방은 종료할 게 없다. 신고는 종료 후에도 열어 둔다.
          onLeave={isEnded ? undefined : () => setIsLeaveModalOpen(true)}
          onReport={() =>
            counterpart && router.push(`/report/${counterpart.userId}?source=chat-room`)
          }
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
