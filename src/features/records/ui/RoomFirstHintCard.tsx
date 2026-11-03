"use client";

import styled from "styled-components";

import { objectParticle, peopleHonorific } from "@/features/records/lib/roomAnswerText";
import type { RoomQuizHint } from "@/features/records/model/types";

type RoomFirstHintCardProps = {
  hint: RoomQuizHint;
  /** 방 인원(나 포함). "두 분 모두" · "네 분 모두". */
  memberCount: number;
};

/**
 * 첫 대화 힌트 — 대화방 안전 안내 바로 아래에 한 번 놓인다(Figma 1:1 3256:51233 · 그룹 3270:36280).
 * "두 분 모두 {주제} / **{답}**를 골랐어요. {이어서 던질 질문}"
 */
export function RoomFirstHintCard({ hint, memberCount }: RoomFirstHintCardProps) {
  return (
    <Card data-cy="room-first-hint">
      <Title>첫 대화 힌트</Title>
      <Body>
        {peopleHonorific(memberCount)} 모두 {hint.topic}
        <br />
        <Answer>{hint.choiceContent}</Answer>
        {objectParticle(hint.choiceContent)} 골랐어요. {hint.prompt}
      </Body>
    </Card>
  );
}

const Card = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-3);
  box-sizing: border-box;
  overflow: hidden;
  border-radius: var(--space-3);
  text-align: center;

  /* 흰 88% + label/assistive 5% 두 겹(Figma Section Message 배경). */
  &::before,
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    background-color: var(--color-semantic-static-white);
    opacity: var(--color-atomic-opacity-88);
  }

  &::after {
    background-color: var(--color-semantic-label-assistive);
    opacity: var(--color-atomic-opacity-5);
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const Title = styled.h3`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-status-positive);
  font-feature-settings: "ss10" 1;
`;

const Body = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-reading-font-size);
  font-weight: 400;
  line-height: var(--typography-label-1-reading-line-height);
  letter-spacing: var(--typography-label-1-reading-letter-spacing);
  color: var(--color-semantic-label-neutral);
  word-break: keep-all;
  font-feature-settings: "ss10" 1;
`;

const Answer = styled.strong`
  font-weight: 500;
  color: var(--color-semantic-label-normal);
`;
