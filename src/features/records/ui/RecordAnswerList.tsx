"use client";

import styled from "styled-components";

import type { QuizHistoryAnswer } from "@/features/records/model/types";
import { RecordQuestionSection } from "@/features/records/ui/RecordQuestionSection";

type RecordAnswerListProps = {
  questions: QuizHistoryAnswer[];
};

function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/** 공개 전 "내가 고른 답 N" — 문항과 내 답만(Figma 3255:36450). */
export function RecordAnswerList({ questions }: RecordAnswerListProps) {
  const ordered = byOrder(questions);
  const answered = ordered.filter((q) => q.myChoiceId !== null).length;

  return (
    <RecordQuestionSection
      heading={`내가 고른 답 ${answered}`}
      items={ordered.map((question) => {
        const mine = question.choices.find((c) => c.choiceId === question.myChoiceId);
        return {
          key: question.quizId,
          node: (
            <Item data-testid="record-answer">
              <Question>
                Q{question.order}. {question.question}
              </Question>
              <Answer>{mine?.content ?? "답하지 않았어요"}</Answer>
            </Item>
          ),
        };
      })}
    />
  );
}

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Question = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const Answer = styled.p`
  margin: 0;
  padding: 0 var(--space-4);
  font-size: var(--typography-body-1-reading-font-size);
  font-weight: var(--typography-body-1-reading-font-weight);
  line-height: var(--typography-body-1-reading-line-height);
  letter-spacing: var(--typography-body-1-reading-letter-spacing);
  color: var(--color-semantic-label-normal);
`;
