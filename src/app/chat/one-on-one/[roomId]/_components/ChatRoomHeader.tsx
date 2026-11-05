"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Body1Normal, Icon, Label1Normal } from "@/shared/ui";
import { useTimer } from "./useTimer";

interface ChatRoomHeaderProps {
  roomId: string;
  partnerNickname: string;
  expiresAt: Date | null;
  isEnded?: boolean;
  onMenuClick: () => void;
  /** 8.1 "우리의 답변" 문서 아이콘. `RECORDS` 플래그가 켜져 방 답변을 읽었을 때만 넘긴다(Figma 3270:34759). */
  onAnswersClick?: () => void;
}

export function ChatRoomHeader({
  partnerNickname,
  expiresAt,
  isEnded = false,
  onMenuClick,
  onAnswersClick,
}: ChatRoomHeaderProps) {
  const router = useRouter();
  const timeLeft = useTimer(expiresAt, isEnded);

  return (
    <HeaderContainer>
      {/* Navigation row */}
      <NavRow>
        <IconButton onClick={() => router.back()}>
          <img src="/icons/navigation/arrow-left.svg" alt="뒤로가기" width={24} height={24} />
        </IconButton>
        {/* 오른쪽에 문서 아이콘이 붙은 만큼 왼쪽도 비워 제목을 화면 가운데에 둔다. */}
        {onAnswersClick && <TrailingBalance aria-hidden />}

        <TitleWrapper>
          {/* 공용 TopNavigation 제목과 같은 크기·굵기(16px·700) */}
          <Body1Normal $align="center" $weight="bold" $color="var(--color-semantic-label-strong)">
            {partnerNickname}
          </Body1Normal>
        </TitleWrapper>

        <TrailingButtons>
          {onAnswersClick && (
            <IconButton onClick={onAnswersClick} aria-label="우리의 답변" data-cy="room-answers-button">
              <Icon name="content.documentText" size={24} />
            </IconButton>
          )}
          <IconButton onClick={onMenuClick} data-cy="chat-menu-button">
            <img src="/icons/action/more-vertical.svg" alt="더보기" width={24} height={24} />
          </IconButton>
        </TrailingButtons>
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
  /* 앱에서 상태바가 웹뷰 위에 겹친다. 웹에서는 0이라 영향이 없다. */
  padding-top: env(safe-area-inset-top, 0px);
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

/* 문서 아이콘은 메뉴 왼쪽 8px 에 붙는다(Figma 3270:34759). */
const TrailingButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

/* 문서 아이콘(24px) + 간격(8px)만큼의 빈 칸. */
const TrailingBalance = styled.span`
  width: calc(var(--space-6) + var(--space-2));
  flex-shrink: 0;
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
  color: var(--color-semantic-label-normal);
`;
