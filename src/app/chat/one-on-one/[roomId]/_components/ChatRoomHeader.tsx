"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Label1Normal, Caption1 } from "@/components/common/Text";
import { useTimer } from "./useTimer";

interface ChatRoomHeaderProps {
  roomId: string;
  partnerNickname: string;
  expiresAt: Date | null;
  onMenuClick: () => void;
}

export default function ChatRoomHeader({
  roomId,
  partnerNickname,
  expiresAt,
  onMenuClick,
}: ChatRoomHeaderProps) {
  const router = useRouter();
  const timeLeft = useTimer(expiresAt);

  return (
    <HeaderContainer>
      <IconButton onClick={() => router.back()}>
        <img src="/icons/navigation/arrow-left.svg" alt="뒤로가기" width={24} height={24} />
      </IconButton>

      <Center>
        <Label1Normal $weight="semibold">{partnerNickname}</Label1Normal>
        <TimeText $urgent={timeLeft.isUrgent}>
          {timeLeft.label}
        </TimeText>
      </Center>

      <IconButton onClick={onMenuClick}>
        <img src="/icons/action/more-vertical.svg" alt="더보기" width={24} height={24} />
      </IconButton>
    </HeaderContainer>
  );
}

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  padding: 0 16px;
  box-sizing: border-box;
  background-color: var(--color-semantic-background-normal-normal, #E9E6E2);
  border-bottom: 1px solid rgba(108, 101, 95, 0.08);
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
`;

const TimeText = styled(Caption1)<{ $urgent: boolean }>`
  color: ${({ $urgent }) =>
    $urgent
      ? "var(--color-semantic-status-negative, #B33528)"
      : "var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61))"};
`;

const IconButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
`;
