"use client";

import styled from "styled-components";

import type { QuizHistoryAnswer, QuizHistoryChoice } from "@/features/records/model/types";
import { RecordQuestionSection } from "@/features/records/ui/RecordQuestionSection";
import { Icon } from "@/shared/ui";

type RecordResultListProps = {
  questions: QuizHistoryAnswer[];
};

function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/** 내 선택지가 소수 의견인지. 서버는 선택지마다 `minority` 를 준다. */
function isMinorityAnswer(question: QuizHistoryAnswer): boolean {
  return question.choices.some(
    (choice) => choice.choiceId === question.myChoiceId && choice.minority === true,
  );
}

/** 공개 후 "질문별 선택" — 선택지마다 비율 막대, 내 답은 테두리·체크·초록 막대(Figma 3255:37133). */
export function RecordResultList({ questions }: RecordResultListProps) {
  return (
    <RecordQuestionSection
      heading="질문별 선택"
      items={byOrder(questions).map((question) => ({
        key: question.quizId,
        node: (
          <Item data-testid="record-result">
            <HeadingRow>
              <Question>
                Q{question.order}. {question.question}
              </Question>
              {isMinorityAnswer(question) && <MinorityBadge>소수 의견</MinorityBadge>}
            </HeadingRow>
            <Choices>
              {/* 선택지는 서버가 준 순서 그대로다(응답에 선택지 순서 값이 없다). */}
              {question.choices.map((choice) => (
                <ChoiceBar
                  key={choice.choiceId}
                  choice={choice}
                  mine={choice.choiceId === question.myChoiceId}
                />
              ))}
            </Choices>
          </Item>
        ),
      }))}
    />
  );
}

function ChoiceBar({ choice, mine }: { choice: QuizHistoryChoice; mine: boolean }) {
  const percent = Math.min(100, Math.max(0, choice.percent ?? 0));

  return (
    <Bar $mine={mine} aria-current={mine ? "true" : undefined}>
      {/* 막대 길이는 런타임 값이라 인라인 폭만 둔다(CLAUDE.md §5.2 허용 범위). */}
      <Fill $mine={mine} style={{ width: `${percent}%` }} />
      <BarContent>
        <ChoiceLabel $mine={mine}>
          {mine && <Icon name="status.check" size={16} label="내 답" />}
          {choice.content}
        </ChoiceLabel>
        <Percent>{choice.percent === undefined ? "-" : `${percent}%`}</Percent>
      </BarContent>
    </Bar>
  );
}

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-10px);
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: var(--space-5);
`;

const Question = styled.p`
  margin: 0;
  min-width: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

/* Figma Content Badge(3255:38275) — 공용 ContentBadge 는 28px·13px 라 시안(20px·11px)과 달라 따로 둔다. */
const MinorityBadge = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: var(--space-5);
  padding: 0 var(--spacing-6px);
  border-radius: var(--spacing-6px);
  background-color: rgb(
    from var(--color-semantic-status-negative) r g b / var(--color-atomic-opacity-8)
  );
  color: var(--color-semantic-status-negative);
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: var(--typography-caption-2-line-height);
  letter-spacing: var(--typography-caption-2-letter-spacing);
  white-space: nowrap;
`;

const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* 내 답만 1px 테두리가 있다. 높이가 같도록 다른 선택지는 투명 테두리를 둔다. */
const Bar = styled.div<{ $mine: boolean }>`
  position: relative;
  overflow: hidden;
  border: 1px solid
    ${({ $mine }) => ($mine ? "var(--color-semantic-primary-normal)" : "transparent")};
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-normal-normal);
`;

const Fill = styled.div<{ $mine: boolean }>`
  position: absolute;
  inset: 0 auto 0 0;
  background-color: ${({ $mine }) =>
    $mine
      ? "var(--color-semantic-inverse-primary)"
      : "var(--color-semantic-background-normal-alternative)"};
`;

const BarContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 7px 13px;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const ChoiceLabel = styled.span<{ $mine: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-6px);
  min-width: 0;
  color: ${({ $mine }) =>
    $mine ? "var(--color-semantic-primary-normal)" : "var(--color-semantic-label-normal)"};
`;

const Percent = styled.span`
  flex-shrink: 0;
`;
