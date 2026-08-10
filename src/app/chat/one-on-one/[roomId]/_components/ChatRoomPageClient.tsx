"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";

import { getCounterpartProfile, getChatRooms, useChatRoom } from "@/features/chat";
import type { CounterpartProfile } from "@/features/chat";
import { getMyMemberId } from "@/shared/lib/auth";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";
import { ChatRoomHeader } from "./ChatRoomHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatLeaveModal } from "./ChatLeaveModal";
import { ChatMenuBottomSheet } from "./ChatMenuBottomSheet";

export function ChatRoomPageClient() {
  const params = useParams();
  const router = useRouter();

  const [roomId] = useState(() =>
    Number(resolveStaticRouteParam("one-on-one", String(params.roomId))),
  );
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [counterpart, setCounterpart] = useState<CounterpartProfile | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { messages, loading, error, hasMore, loadingOlder, loadOlder, status, sendText, sendImages } =
    useChatRoom(roomId);

  useEffect(() => {
    setMyUserId(getMyMemberId());
  }, []);

  // 방 상세 API가 없어졌다. 상대 정보는 방 목록의 counterpartMemberIds로 찾아 프로필을 조회한다.
  useEffect(() => {
    if (!Number.isFinite(roomId)) return undefined;

    let active = true;
    getChatRooms()
      .then(async (rooms) => {
        const room = rooms.find((item) => item.roomId === roomId);
        const counterpartId = room?.counterpartMemberIds[0];
        if (counterpartId === undefined) return;

        const profile = await getCounterpartProfile(counterpartId);
        if (active) setCounterpart(profile);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [roomId]);

  const handleLeave = () => {
    // 라이브 BE에 나가기 엔드포인트가 없다. 목록으로 돌아가기만 한다.
    router.replace("/chat");
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

  return (
    <PageContainer>
      <ChatRoomHeader
        roomId={String(roomId)}
        partnerNickname={partnerNickname}
        expiresAt={null}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      <MessageList
        messages={messages}
        myUserId={myUserId}
        partnerAvatarUrl={counterpart?.profileImageUrl ?? null}
        partnerNickname={partnerNickname}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        notice={
          status === "disconnected"
            ? "연결이 끊겼어요. 다시 연결되면 놓친 메시지를 불러올게요."
            : null
        }
      />

      <ChatInput onSend={sendText} onSendImages={sendImages} />

      {isMenuOpen && (
        <ChatMenuBottomSheet
          onClose={() => setIsMenuOpen(false)}
          onLeave={() => setIsLeaveModalOpen(true)}
          onReport={() =>
            counterpart && router.push(`/report/${counterpart.userId}?source=chat-room`)
          }
        />
      )}

      <ChatLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeave}
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
