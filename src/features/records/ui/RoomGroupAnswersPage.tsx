"use client";

import styled from "styled-components";

import type { GroupQuestionView } from "@/features/records/lib/roomAnswers";
import { toGroupViews } from "@/features/records/lib/roomAnswers";
import type { RoomQuizAnswers, RoomQuizQuestion } from "@/features/records/model/types";
import {
  RoomAnswersHeaderCard,
  RoomAnswersPageShell,
  RoomAnswersSection,
  RoomQuestionBlock,
  RoomQuestionLabel,
  RoomSameAnswerRow,
  RoomShareButton,
} from "@/features/records/ui/RoomAnswersPageParts";
import { Icon } from "@/shared/ui";

type RoomGroupAnswersPageProps = {
  data: RoomQuizAnswers;
  canShare: boolean;
  onClose: () => void;
  onShare: (question: RoomQuizQuestion) => void;
};

const SHARE_LABEL = "대화방에 이 질문 올리기";

/**
 * 8.1.2 그룹 대화방 > 우리 그룹의 답변(Figma 3258:54028).
 *
 * 누가 무엇을 골랐는지는 숨기고 선택지별 인원만 점으로 보인다. 내 선택지에만 체크·검은 점.
 * 묶음 순서: 반반 갈린 질문(이야기거리 1순위) → 다 같이 고른 답 → 나머지 질문. 빈 묶음은 숨긴다.
 */
export function RoomGroupAnswersPage({
  data,
  canShare,
  onClose,
  onShare,
}: RoomGroupAnswersPageProps) {
  const views = toGroupViews(data);
  const split = views.filter((view) => view.agreement === "SPLIT");
  const allSame = views.filter((view) => view.agreement === "ALL_SAME");
  const other = views.filter((view) => view.agreement === "OTHER");
  const memberCount = data.members.length;

  const renderChoiceBlock = ({ question }: GroupQuestionView) => (
    <RoomQuestionBlock key={question.quizId} data-cy="room-group-question">
      <RoomQuestionLabel order={question.order} question={question.question} />
      <ChoiceRows>
        {question.choices
          .filter((choice) => choice.memberCount > 0)
          .map((choice) => {
            const isMine = choice.choiceId === question.myChoiceId;
            return (
              <ChoiceRow key={choice.choiceId}>
                <ChoiceName $isMine={isMine}>
                  {isMine && <Icon name="status.check" size={16} label="내 답" />}
                  {choice.content}
                </ChoiceName>
                <ChoiceCount>
                  <Dots aria-hidden>
                    {Array.from({ length: memberCount }, (_, index) => (
                      <Dot
                        key={index}
                        $state={index < choice.memberCount ? (isMine ? "mine" : "other") : "empty"}
                      />
                    ))}
                  </Dots>
                  <CountText>{choice.memberCount}명</CountText>
                </ChoiceCount>
              </ChoiceRow>
            );
          })}
      </ChoiceRows>
      <RoomShareButton label={SHARE_LABEL} disabled={!canShare} onClick={() => onShare(question)} />
    </RoomQuestionBlock>
  );

  return (
    <RoomAnswersPageShell title="우리 그룹의 답변" onClose={onClose}>
      <RoomAnswersHeaderCard
        members={data.members}
        caption={`${memberCount}명이 ${views.length}개 질문 중`}
        headline={`${allSame.length}개를 다 같이 골랐어요`}
        note="누가 어떤 답을 골랐는지는 보이지 않아요. 내 답만 표시돼요."
      />

      {split.length > 0 && (
        <RoomAnswersSection title={`반반 갈린 질문 ${split.length}`} aside="이야기거리 1순위">
          {split.map(renderChoiceBlock)}
        </RoomAnswersSection>
      )}

      {allSame.length > 0 && (
        <RoomAnswersSection title={`다 같이 고른 답 ${allSame.length}`}>
          {allSame.map(({ question }) => (
            <RoomSameAnswerRow
              key={question.quizId}
              order={question.order}
              question={question.question}
              answer={question.choices.find((choice) => choice.memberCount > 0)?.content ?? ""}
              shareLabel={SHARE_LABEL}
              shareDisabled={!canShare}
              onShare={() => onShare(question)}
            />
          ))}
        </RoomAnswersSection>
      )}

      {other.length > 0 && (
        <RoomAnswersSection title={`나머지 질문 ${other.length}`}>
          {other.map(renderChoiceBlock)}
        </RoomAnswersSection>
      )}
    </RoomAnswersPageShell>
  );
}

/* 선택지 줄과 버튼 사이는 16px(Figma 3259:54839) — 묶음 gap 8 + 버튼 4 + 여기 4. */
const ChoiceRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6px);
  margin-bottom: var(--space-1);
`;

const ChoiceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

const ChoiceName = styled.span<{ $isMine: boolean }>`
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--spacing-6px);
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: ${({ $isMine }) =>
    $isMine ? "var(--color-semantic-primary-normal)" : "var(--color-semantic-label-alternative)"};
  word-break: keep-all;
`;

const ChoiceCount = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-3);
`;

const Dots = styled.span`
  display: inline-flex;
  gap: var(--spacing-6px);
`;

/* 16px 점. 내 선택지 = primary, 남의 선택지 = label/alternative, 빈 자리 = elevated/normal(Figma 3259:54849). */
const Dot = styled.span<{ $state: "mine" | "other" | "empty" }>`
  width: var(--space-4);
  height: var(--space-4);
  border-radius: 50%;
  background-color: ${({ $state }) =>
    $state === "mine"
      ? "var(--color-semantic-primary-normal)"
      : $state === "other"
        ? "var(--color-semantic-label-alternative)"
        : "var(--color-semantic-background-elevated-normal)"};
`;

const CountText = styled.span`
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-primary-normal);
`;
