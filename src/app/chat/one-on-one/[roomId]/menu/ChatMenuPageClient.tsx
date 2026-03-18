"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import Nav from "@/components/display/Nav";
import { Title3, Caption1, Headline2 } from "@/components/common/Text";
import { ChatService, ChatRoomDetailDto } from "@/lib/api/services/ChatService";
import ChatLeaveModal from "../_components/ChatLeaveModal";

export default function ChatMenuPageClient() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();

  const [roomDetail, setRoomDetail] = useState<ChatRoomDetailDto | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  useEffect(() => {
    ChatService.chatControllerGetChatRoomDetail(roomId)
      .then((res) => {
        if (res.success && res.data) setRoomDetail(res.data);
      })
      .catch(() => router.replace("/home"));
  }, [roomId, router]);

  const handleLeave = async () => {
    await ChatService.chatControllerLeaveChatRoom(roomId, {});
    router.replace("/home");
  };

  if (!roomDetail) return null;

  const { partner } = roomDetail;

  return (
    <PageContainer>
      <Nav prev={() => router.back()} />

      <ProfileSection>
        <Avatar
          src={partner.profileImageUrl ?? "/assets/avatar/f1.png"}
          alt={partner.nickname}
        />
        <Title3 style={{ marginTop: 12 }}>{partner.nickname}</Title3>
        {partner.matchScore !== null && (
          <MatchBadge>
            <Caption1 $color="var(--color-semantic-status-negative, #B33528)">
              🌟 당신과 가장 비슷해요
            </Caption1>
          </MatchBadge>
        )}
      </ProfileSection>

      <MenuSection>
        <ContactCard>
          <Headline2>연락처 교환</Headline2>
          <img src="/icons/navigation/chevron-right.svg" alt="이동" width={20} height={20} />
        </ContactCard>

        <ActionList>
          <ActionItem onClick={() => {}}>
            <Headline2>신고하기</Headline2>
          </ActionItem>
          <Divider />
          <ActionItem onClick={() => setIsLeaveModalOpen(true)}>
            <Headline2 $color="var(--color-semantic-status-negative, #B33528)">
              채팅 나가기
            </Headline2>
          </ActionItem>
        </ActionList>
      </MenuSection>

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
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal, #E9E6E2);
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(108, 101, 95, 0.08);
`;

const MatchBadge = styled.div`
  margin-top: 6px;
`;

const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px;
`;

const ContactCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #F3F1EF;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
`;

const ActionList = styled.div`
  background-color: rgba(108, 101, 95, 0.08);
  border-radius: 12px;
  overflow: hidden;
`;

const ActionItem = styled.div`
  padding: 16px;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(108, 101, 95, 0.08);
  margin: 0 16px;
`;
