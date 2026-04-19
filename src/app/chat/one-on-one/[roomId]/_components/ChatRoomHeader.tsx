"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Headline2, Label1Normal } from "@/components/common/Text";
import { useTimer } from "./useTimer";

interface ChatRoomHeaderProps {
  roomId: string;
  partnerNickname: string;
  expiresAt: Date | null;
  onMenuClick: () => void;
}

export function ChatRoomHeader({
  roomId,
  partnerNickname,
  expiresAt,
  onMenuClick,
}: ChatRoomHeaderProps) {
  const router = useRouter();
  const timeLeft = useTimer(expiresAt);

  return (
    <HeaderContainer>
      {/* Navigation row */}
      <NavRow>
        <IconButton onClick={() => router.back()}>
          <img src="/icons/navigation/arrow-left.svg" alt="뒤로가기" width={24} height={24} />
        </IconButton>

        <TitleWrapper>
          <Headline2 $align="center">{partnerNickname}</Headline2>
        </TitleWrapper>

        <IconButton onClick={onMenuClick}>
          <img src="/icons/action/more-vertical.svg" alt="더보기" width={24} height={24} />
        </IconButton>
      </NavRow>

      {/* Tool row */}
      <ToolRow>
        <TimeText $urgent={timeLeft.isUrgent}>
          {timeLeft.label}
        </TimeText>
      </ToolRow>
    </HeaderContainer>
  );
}

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--color-semantic-background-normal-normal);
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 16px 0;
  box-sizing: border-box;
  margin-bottom: -4px; /* p 태그 line-height half-leading 상쇄 */
`;

const TitleWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
`;

const ToolRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding-bottom: 10px;
  box-sizing: border-box;
`;

const TimeText = styled(Label1Normal)<{ $urgent: boolean }>`
  color: ${({ $urgent }) =>
    $urgent
      ? "var(--color-semantic-status-negative)"
      : "var(--color-semantic-label-assistive)"};
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
