"use client";

import styled from "styled-components";

import { containsMoneyRequest, containsRiskyLink } from "@/features/chat";

/**
 * 메시지 아래에 붙는 주의 카드.
 *
 * 1:1 방(`MessageList`)에만 있던 것을 그룹 방(`GroupMessageList`)과 함께 쓰려고 옮겼다 —
 * 같은 사기 수법이 그룹 방에도 그대로 들어오는데 그쪽만 안내가 없었다(2026-09-15 QA).
 *
 * **보내는 쪽을 막지 않는다.** 링크·금액은 정상 대화(가게 주소, 더치페이 정산)가 더 많아
 * 막으면 오탐 피해가 크다. 받는 쪽에 위험을 알리는 데까지만 한다.
 */
export function ChatSafetyWarning({ message }: { message: string }) {
  return (
    <WarningCard>
      <WarningCardContent>
        <WarningIconWrap>
          <WarningIconBackdrop />
          <WarningIcon src="/icons/status/warning.svg" alt="주의" width={20} height={20} />
        </WarningIconWrap>
        <WarningMessage>{message}</WarningMessage>
      </WarningCardContent>
    </WarningCard>
  );
}

export const LINK_WARNING_TEXT =
  "출처 불명의 링크는 악성코드 또는 피싱 사이트로 연결될 수 있습니다. 클릭에 주의하세요!";

export const MONEY_WARNING_TEXT = "금전 요구는 100% 사기입니다. 피해 위험이 있으니 주의하세요!";

/**
 * 메시지 하나에 붙일 주의 카드들. 링크와 금전 요구가 한 문장에 같이 있으면 둘 다 붙는다
 * ("이 계좌로 보내세요 http://…" 가 정확히 그 모양이다).
 *
 * `keyPrefix` 는 목록에서 메시지를 가리키는 키다 — 두 방 화면이 서로 다른 키 체계를 써서
 * (1:1 은 optimistic 까지 섞인 문자열, 그룹은 메시지 ID) 호출부가 넘긴다.
 */
export function renderChatSafetyWarnings(content: string, keyPrefix: string): React.ReactElement[] {
  const items: React.ReactElement[] = [];

  if (containsRiskyLink(content)) {
    items.push(<ChatSafetyWarning key={`link-warning-${keyPrefix}`} message={LINK_WARNING_TEXT} />);
  }

  if (containsMoneyRequest(content)) {
    items.push(
      <ChatSafetyWarning key={`money-warning-${keyPrefix}`} message={MONEY_WARNING_TEXT} />,
    );
  }

  return items;
}

const WarningCard = styled.div`
  position: relative;
  overflow: clip;
  border-radius: 12px;
  width: 100%;
  margin-top: 4px;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-background-normal-normal);
    opacity: 0.88;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-status-cautionary);
    opacity: 0.05;
  }
`;

const WarningCardContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
`;

const WarningIconWrap = styled.div`
  position: relative;
  width: 20px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WarningIconBackdrop = styled.div`
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 5px;
  right: 5px;
  background-color: var(--color-semantic-static-white);
  border-radius: 100px;
`;

const WarningIcon = styled.img`
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
`;

const WarningMessage = styled.p`
  flex: 1;
  margin: 0;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-status-cautionary);
  font-feature-settings: "ss10" on;
`;
