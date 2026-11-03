"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Icon } from "@/shared/ui";
import { getGroupRoomTitle } from "@/features/chat";
import { useTimer } from "@/app/chat/one-on-one/[roomId]/_components/useTimer";

interface GroupChatRoomHeaderProps {
  memberNames: string[];
  /** 그룹 퀴즈 주제. 서버가 주지 못하면(예전 방·조회 실패) null 이다. */
  roomName?: string | null;
  totalMembers: number;
  expiresAt: Date | null;
  onMenuClick: () => void;
  /** 8.1 "우리 그룹의 답변" 문서 아이콘. 테스터 모드에서 방 답변을 읽었을 때만 넘긴다(Figma 3262:55446). */
  onAnswersClick?: () => void;
  /** 문서 아이콘 아래 첫 진입 안내 말풍선(Figma 3262:55481). 헤더 기준 절대 위치로 놓인다. */
  answersTooltip?: ReactNode;
}

export function GroupChatRoomHeader({
  memberNames,
  roomName,
  totalMembers,
  expiresAt,
  onMenuClick,
  onAnswersClick,
  answersTooltip,
}: GroupChatRoomHeaderProps) {
  const router = useRouter();
  const timeLeft = useTimer(expiresAt);

  const titleText = getGroupRoomTitle(roomName, memberNames);

  return (
    <HeaderContainer>
      <NavRow>
        <IconButton onClick={() => router.back()}>
          <img src="/icons/navigation/arrow-left.svg" alt="뒤로가기" width={24} height={24} />
        </IconButton>
        {/* 오른쪽에 문서 아이콘이 붙은 만큼 왼쪽도 비워 제목을 화면 가운데에 둔다. */}
        {onAnswersClick && <TrailingBalance aria-hidden />}

        <TitleWrapper>
          <TitleInner>
            <TitleText>{titleText}</TitleText>
            {totalMembers > 0 && <MemberCount>{totalMembers}</MemberCount>}
          </TitleInner>
        </TitleWrapper>

        <TrailingButtons>
          {onAnswersClick && (
            <IconButton onClick={onAnswersClick} aria-label="우리 그룹의 답변" data-cy="room-answers-button">
              <Icon name="content.documentText" size={24} />
            </IconButton>
          )}
          <IconButton onClick={onMenuClick}>
            <img src="/icons/action/more-vertical.svg" alt="더보기" width={24} height={24} />
          </IconButton>
        </TrailingButtons>
      </NavRow>

      <ToolRow>
        <TimeText $urgent={timeLeft.isUrgent}>
          {timeLeft.label}
        </TimeText>
      </ToolRow>
      {answersTooltip}
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
  margin-bottom: -4px;
`;

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
  padding: 0 4px;
`;

const TitleInner = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
`;

/* 공용 TopNavigation 제목과 같은 크기·굵기(16px·700). */
const TitleText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 700;
  line-height: var(--typography-body-1-normal-line-height);
  color: var(--color-semantic-label-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
`;

const MemberCount = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 700;
  line-height: var(--typography-body-1-normal-line-height);
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
  color: var(--color-semantic-label-normal);
`;
