"use client";

import styled from "styled-components";

import { Icon } from "@/shared/ui";

type RoomAnswersSummaryBarProps = {
  /** "같은 답 7 · 다른 답 5" / "다 같은 답 4 · 반반 2". */
  label: string;
  /**
   * `light`: 1:1 방 — 흰 바탕 + 검은 버튼(Figma 3256:51192).
   * `dark`: 그룹 방, 진행 중 투표가 없을 때 — 검은 바탕 + 흰 버튼(Figma 3270:34666).
   */
  tone: "light" | "dark";
  onOpen: () => void;
};

/**
 * 대화방 헤더 아래 "우리의 답변" 요약 바. 만남 투표 배너(VoteBanner)와 같은 자리·같은 틀이라
 * 크기·여백을 그쪽에 맞춘다 — 그룹 방은 투표가 진행 중이면 이 바 대신 투표 배너가 뜬다.
 */
export function RoomAnswersSummaryBar({ label, tone, onOpen }: RoomAnswersSummaryBarProps) {
  return (
    <Bar $tone={tone} data-cy="room-answers-summary">
      <Content>
        <IconSlot aria-hidden>
          <Icon name="content.documentText" size={20} />
        </IconSlot>
        <Label>{label}</Label>
        <OpenButton type="button" $tone={tone} onClick={onOpen}>
          우리의 답변 보기
        </OpenButton>
      </Content>
    </Bar>
  );
}

const Bar = styled.div<{ $tone: "light" | "dark" }>`
  position: relative;
  flex-shrink: 0;
  margin: 0 var(--space-3);
  overflow: hidden;
  border-radius: var(--space-3);
  background-color: ${({ $tone }) =>
    $tone === "dark" ? "var(--color-semantic-label-normal)" : "var(--color-semantic-static-white)"};
  color: ${({ $tone }) =>
    $tone === "dark" ? "var(--color-semantic-static-white)" : "var(--color-semantic-label-normal)"};

  /* Figma 의 label/assistive 5% 덧칠. 두 톤 모두 같은 층이 깔린다. */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-label-assistive);
    opacity: var(--color-atomic-opacity-5);
    pointer-events: none;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
`;

const IconSlot = styled.span`
  display: inline-flex;
  flex-shrink: 0;
`;

const Label = styled.p`
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  font-feature-settings: "ss10" 1;
`;

const OpenButton = styled.button<{ $tone: "light" | "dark" }>`
  flex-shrink: 0;
  /* Figma 7px 14px — 맞는 토큰이 없어 토큰 합으로 정확히 맞춘다. */
  padding: calc(var(--spacing-6px) + var(--spacing-1px)) calc(var(--space-3) + var(--spacing-2px));
  border: none;
  border-radius: var(--space-2);
  cursor: pointer;
  background-color: ${({ $tone }) =>
    $tone === "dark" ? "var(--color-semantic-static-white)" : "var(--color-semantic-primary-normal)"};
  color: ${({ $tone }) =>
    $tone === "dark" ? "var(--color-semantic-label-normal)" : "var(--color-semantic-static-white)"};
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-2-font-size);
  font-weight: 600;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  font-feature-settings: "ss10" 1;

  &:active {
    opacity: var(--color-atomic-opacity-74);
  }
`;
