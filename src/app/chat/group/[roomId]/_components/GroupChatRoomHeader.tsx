"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useTimer } from "@/app/chat/one-on-one/[roomId]/_components/useTimer";

interface GroupChatRoomHeaderProps {
  memberNames: string[];
  totalMembers: number;
  expiresAt: Date | null;
  onMenuClick: () => void;
}

export function GroupChatRoomHeader({
  memberNames,
  totalMembers,
  expiresAt,
  onMenuClick,
}: GroupChatRoomHeaderProps) {
  const router = useRouter();
  const timeLeft = useTimer(expiresAt);

  const titleText = memberNames.join(", ");

  return (
    <HeaderContainer>
      <NavRow>
        <IconButton onClick={() => router.back()}>
          <img src="/icons/navigation/arrow-left.svg" alt="뒤로가기" width={24} height={24} />
        </IconButton>

        <TitleWrapper>
          <TitleInner>
            <TitleText>{titleText}</TitleText>
            {totalMembers > 0 && <MemberCount>{totalMembers}</MemberCount>}
          </TitleInner>
        </TitleWrapper>

        <IconButton onClick={onMenuClick}>
          <img src="/icons/action/more-vertical.svg" alt="더보기" width={24} height={24} />
        </IconButton>
      </NavRow>

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
  margin-bottom: -4px;
`;

const TitleWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 0 4px;
`;

const TitleInner = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
`;

const TitleText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  color: var(--color-semantic-label-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
`;

const MemberCount = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  color: var(--color-semantic-primary-heavy);
  flex-shrink: 0;
`;

const ToolRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding-bottom: 10px;
  box-sizing: border-box;
`;

const TimeText = styled.span<{ $urgent: boolean }>`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: 1.429;
  letter-spacing: 0.203px;
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
