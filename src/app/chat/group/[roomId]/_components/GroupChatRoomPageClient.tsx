"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import {
  deriveRoomState,
  getRoomEndedMessage,
  GROUP_VOTE_ENABLED,
  useChatRoom,
  useChatRoomMeta,
} from "@/features/chat";
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
import { BottomActionArea, Button } from "@/shared/ui";
import type { CounterpartProfile } from "@/features/chat";

/**
 * 그룹 채팅방.
 *
 * 그룹 방은 정원이 차면 서버가 자동 생성하고, 1:1·재매칭과 **같은** `/api/v1/chat/rooms`
 * 계약을 쓴다(메시지 조회·읽음·이미지·STOMP 경로 모두 동일). 별도 group-rooms 엔드포인트는
 * 존재하지 않으므로 1:1과 같은 훅을 그대로 재사용한다.
 *
 * 그룹은 `POST /chat/rooms/{id}/end`로 끝낼 수 없다(7002). 기한 만료로만 종료된다.
 */
export function GroupChatRoomPageClient() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();

  const [roomId] = useState(() => Number(resolveStaticRouteParam("group", String(params.roomId))));
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CounterpartProfile | null>(null);

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

  const roomState = room ? deriveRoomState(room) : "OPEN";
  const isEnded = roomState === "ENDED";
  const expiresAt = useMemo(() => parseServerDateTime(room?.expiresAt), [room?.expiresAt]);

  const memberNames = members.map((member) => member.nickname);
  // counterpartMemberIds는 나를 뺀 인원이다. 표시용 총원에는 나를 더한다.
  const totalMembers = members.length + 1;

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

      <GroupMessageList
        messages={messages}
        myUserId={myUserId}
        memberById={memberById}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        notice={notice}
        onImageClick={(imageUrl) => window.open(imageUrl, "_blank", "noopener,noreferrer")}
      />

      {!isEnded && (
        <ChatInput
          onSend={sendText}
          onSendImages={sendImages}
          disabled={roomState !== "OPEN"}
        />
      )}

      {isEnded && (
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
          // 투표는 BE 계약이 없다(INTEGRATION-TODO.md §A-2). 생기기 전에는 진입점을 숨긴다.
          canCreateVote={GROUP_VOTE_ENABLED}
          onClose={() => setIsMenuOpen(false)}
          onMemberList={() => setIsMemberListOpen(true)}
          onReport={() => showToast("그룹 채팅 신고는 멤버 목록에서 상대를 선택해 주세요.", "info")}
        />
      )}

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
