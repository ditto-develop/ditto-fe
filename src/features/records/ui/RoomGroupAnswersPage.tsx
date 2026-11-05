"use client";

import styled from "styled-components";

import { groupGroupAnswers } from "@/features/records/lib/roomAnswers";
import type {
  QuizDistributionItem,
  QuizDistributionResponse,
  RoomQuizMember,
} from "@/features/records/model/types";
import {
  RoomAnswersHeaderCard,
  RoomAnswersPageShell,
  RoomAnswersSection,
  RoomQuestionBlock,
  RoomQuestionLabel,
  RoomSameAnswerRow,
  RoomShareButton,
  shareStateOf,
} from "@/features/records/ui/RoomAnswersPageParts";
import { Icon } from "@/shared/ui";

type RoomGroupAnswersPageProps = {
  data: QuizDistributionResponse;
  /** 머리 카드 원. 서버 분포 API 에는 멤버가 없다(누가 무엇을 골랐는지 잇지 않으려고). */
  members: RoomQuizMember[];
  share: { canSend: boolean; lockedMessage: string };
  onClose: () => void;
  onShare: (item: QuizDistributionItem) => void;
  onLockedTap: (message: string) => void;
};

const SHARE_LABEL = "대화방에 이 질문 올리기";

/**
 * 8.1.2 그룹 대화방 > 우리 그룹의 답변(Figma 3258:54028). 서버 `quiz-distribution` 값 그대로다.
 *
 * 누가 무엇을 골랐는지는 숨기고 선택지별 인원만 점으로 보인다. 내 선택지에만 체크·검은 점.
 * 묶음 순서: 반반 갈린 질문(서버 `splitQuizIds`, 최대 3개) → 다 같이 고른 답 → 나머지 질문. 빈 묶음은 숨긴다.
 */
export function RoomGroupAnswersPage({
  data,
  members,
  share,
  onClose,
  onShare,
  onLockedTap,
}: RoomGroupAnswersPageProps) {
  const { split, unanimous, other } = groupGroupAnswers(data);
  const memberCount = data.memberCount;

  const renderChoiceBlock = (item: QuizDistributionItem) => (
    <RoomQuestionBlock key={item.quizId} data-cy="room-group-question">
      <RoomQuestionLabel order={item.order} question={item.question} />
      <ChoiceRows>
        {item.choices
          .filter((choice) => choice.count > 0)
          .map((choice) => {
            const isMine = choice.choiceId === item.myChoiceId;
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
                        $state={index < choice.count ? (isMine ? "mine" : "other") : "empty"}
                      />
                    ))}
                  </Dots>
                  <CountText>{choice.count}명</CountText>
                </ChoiceCount>
              </ChoiceRow>
            );
          })}
      </ChoiceRows>
      <RoomShareButton
        label={SHARE_LABEL}
        state={shareStateOf(item, share)}
        onClick={() => onShare(item)}
      />
    </RoomQuestionBlock>
  );

  return (
    <RoomAnswersPageShell title="우리 그룹의 답변" onClose={onClose}>
      <RoomAnswersHeaderCard
        members={members}
        caption={`${memberCount}명이 ${data.totalCount}개 질문 중`}
        headline={`${data.unanimousCount}개를 다 같이 골랐어요`}
        note="누가 어떤 답을 골랐는지는 보이지 않아요. 내 답만 표시돼요."
      />

      {split.length > 0 && (
        <RoomAnswersSection title={`반반 갈린 질문 ${split.length}`} aside="이야기거리 1순위">
          {split.map(renderChoiceBlock)}
        </RoomAnswersSection>
      )}

      {unanimous.length > 0 && (
        <RoomAnswersSection title={`다 같이 고른 답 ${unanimous.length}`}>
          {unanimous.map((item) => (
            <RoomSameAnswerRow
              key={item.quizId}
              order={item.order}
              question={item.question}
              answer={item.choices.find((choice) => choice.count > 0)?.content ?? ""}
              shareLabel={SHARE_LABEL}
              shareState={shareStateOf(item, share)}
              onShare={() => onShare(item)}
              onLockedTap={onLockedTap}
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
