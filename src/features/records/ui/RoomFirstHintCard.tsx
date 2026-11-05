"use client";

import styled from "styled-components";

import type { QuizHintContent } from "@/features/chat/model/types";
import { describeHint } from "@/features/records/lib/roomAnswerText";

type RoomFirstHintCardProps = {
  hint: QuizHintContent;
};

/**
 * 첫 대화 힌트 — 방이 열리는 순간 서버가 남기는 `QUIZ_HINT` 메시지(IMP-1 BE-4). 메시지 목록 안에서
 * 가운데 카드로 그린다(Figma 1:1 3256:51233 · 그룹 3270:36280). 보낸 사람이 없고 안 읽음·푸시 대상이 아니다.
 *
 * "“{문항}” / 두 분 모두 **{답}**를 골랐어요. {이어서 던질 질문}"
 * 테스터 모드와 상관없이 그린다 — 서버 `QUIZ_CHAT` 플래그가 켜지면 모든 회원의 방에 온다.
 */
export function RoomFirstHintCard({ hint }: RoomFirstHintCardProps) {
  const sentence = describeHint(hint);

  return (
    <Card data-cy="room-first-hint">
      <Title>첫 대화 힌트</Title>
      <Question>&ldquo;{hint.question}&rdquo;</Question>
      <Body>
        {sentence.lead}
        {sentence.answer && <Answer>{sentence.answer}</Answer>}
        {sentence.tail} {sentence.follow}
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

const Question = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-reading-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-reading-line-height);
  letter-spacing: var(--typography-label-1-reading-letter-spacing);
  color: var(--color-semantic-label-normal);
  word-break: keep-all;
  font-feature-settings: "ss10" 1;
`;

const Answer = styled.strong`
  font-weight: 500;
  color: var(--color-semantic-label-normal);
`;
