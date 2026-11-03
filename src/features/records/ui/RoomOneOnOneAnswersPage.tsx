"use client";

import styled from "styled-components";

import { findPartner, toOneOnOneViews } from "@/features/records/lib/roomAnswers";
import { topicParticle } from "@/features/records/lib/roomAnswerText";
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

type RoomOneOnOneAnswersPageProps = {
  data: RoomQuizAnswers;
  /** 방이 열려 있고 내가 보낼 수 있을 때만 true. 아니면 말 걸기 버튼이 모두 꺼진다. */
  canShare: boolean;
  onClose: () => void;
  /** 문항을 고르면 이 화면을 닫고 입력창 위에 미리보기를 붙인다(Figma 3279:35005). */
  onShare: (question: RoomQuizQuestion) => void;
};

const SHARE_LABEL = "이 질문으로 말 걸기";

/** 8.1.1 1:1 대화방 > 우리의 답변(Figma 3257:52969). */
export function RoomOneOnOneAnswersPage({
  data,
  canShare,
  onClose,
  onShare,
}: RoomOneOnOneAnswersPageProps) {
  const partner = findPartner(data.members);
  const views = toOneOnOneViews(data);
  const same = views.filter((view) => view.same);
  const different = views.filter((view) => !view.same);
  const hint = data.firstHint;
  const showHintBox = hint !== null && hint.percent !== null && same.some((v) => v.question.quizId === hint.quizId);

  return (
    <RoomAnswersPageShell title="우리의 답변" onClose={onClose}>
      <RoomAnswersHeaderCard
        members={data.members}
        caption={`${views.length}개 질문 중`}
        headline={`${same.length}개가 같아요`}
      >
        {showHintBox && hint && (
          <HintBox>
            <HintIcon aria-hidden>
              <Icon name="content.lightbulb" size={20} />
            </HintIcon>
            <HintText>
              <strong>{hint.choiceContent}</strong>
              {topicParticle(hint.choiceContent)} 전체의 {hint.percent}%만 고른 답이에요. 두 분 다
              이 답을 골랐어요.
            </HintText>
          </HintBox>
        )}
      </RoomAnswersHeaderCard>

      {same.length > 0 && (
        <RoomAnswersSection title={`같은 답 ${same.length}`}>
          {same.map(({ question, mine }) => (
            <RoomSameAnswerRow
              key={question.quizId}
              order={question.order}
              question={question.question}
              answer={mine?.content ?? ""}
              highlighted={hint?.quizId === question.quizId}
              shareLabel={SHARE_LABEL}
              // 보낸 이력이 있는 문항은 보냄 버튼 비활성(Figma 주석 3276:34949).
              shareDisabled={!canShare || question.sharedAt !== null}
              onShare={() => onShare(question)}
            />
          ))}
        </RoomAnswersSection>
      )}

      {different.length > 0 && (
        <RoomAnswersSection title={`다른 답 ${different.length}`} aside="대화거리는 여기 많아요">
          {different.map(({ question, mine, partner: theirs }) => (
            <RoomQuestionBlock key={question.quizId} data-cy="room-different-answer">
              <RoomQuestionLabel order={question.order} question={question.question} />
              <Tiles>
                <Tile $tone="mine">
                  <TileName $tone="mine">나</TileName>
                  <TileAnswer $tone="mine">{mine?.content ?? "-"}</TileAnswer>
                </Tile>
                <Tile $tone="other">
                  <TileName $tone="other">{partner?.nickname ?? "상대방"}</TileName>
                  <TileAnswer $tone="other">{theirs?.content ?? "-"}</TileAnswer>
                </Tile>
              </Tiles>
              <RoomShareButton
                label={SHARE_LABEL}
                disabled={!canShare || question.sharedAt !== null}
                onClick={() => onShare(question)}
              />
            </RoomQuestionBlock>
          ))}
        </RoomAnswersSection>
      )}
    </RoomAnswersPageShell>
  );
}

/* 전체의 n%만 고른 답 안내 — fill/normal 바탕(Figma 3257:53278). */
const HintBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-4);
  box-sizing: border-box;
  border-radius: var(--space-3);
  background-color: var(--color-semantic-fill-normal);
`;

const HintIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-semantic-status-negative);
`;

const HintText = styled.p`
  flex: 1;
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
  word-break: keep-all;

  strong {
    font-weight: 600;
    color: var(--color-semantic-label-normal);
  }
`;

const Tiles = styled.div`
  display: flex;
  gap: var(--space-2);
`;

/* 나(밝음) / 상대(어두움) 답 타일, 156px 두 칸(Figma 3257:53436 · 3258:53448). */
const Tile = styled.div<{ $tone: "mine" | "other" }>`
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  padding: var(--spacing-6px) var(--space-3);
  border-radius: var(--radius-radi-4);
  background-color: ${({ $tone }) =>
    $tone === "mine"
      ? "var(--color-semantic-background-elevated-normal)"
      : "var(--color-semantic-primary-normal)"};
`;

const TileName = styled.span<{ $tone: "mine" | "other" }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: ${({ $tone }) =>
    $tone === "mine" ? "var(--color-semantic-label-neutral)" : "var(--color-semantic-interaction-disable)"};
`;

const TileAnswer = styled.span<{ $tone: "mine" | "other" }>`
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: ${({ $tone }) =>
    $tone === "mine"
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-background-normal-normal)"};
  word-break: keep-all;
`;
