"use client";

import styled from "styled-components";

import { toQuizChips, unanimousChoice } from "@/features/records/lib/roomAnswerText";
import type { ChatQuizCard } from "@/features/records/model/types";
import { ChatQuizChips } from "@/features/records/ui/ChatQuizChips";

type ChatQuizCardViewProps = {
  card: ChatQuizCard;
  myUserId: number | null;
  /** 1:1 칩의 상대 이름. 모르는 회원이면 "알 수 없음". */
  nameOf: (memberId: number) => string;
  /** 그룹 칩에서 내 선택지를 밝게 칠 때 쓴다. 모르면 생략 — 모든 칩이 밝게 나온다. */
  myChoiceId?: number | null;
  /**
   * 이어서 던질 질문. 카드 스냅샷의 `card.prompt` 가 정본이고, 호출부는 스냅샷에 없을 때만 방 답변에서
   * 찾은 값을 넘긴다. Figma 그룹 카드 주석 "힌트 질문 한 줄 구성" 3273:37755 · 3273:37774.
   */
  prompt?: string | null;
};

/**
 * "질문 보내기" 로 올라온 문항 카드(messageType QUIZ). 말풍선 대신 흰 카드로 그린다.
 *
 * - 답이 갈렸으면 칩: "나 · 노을빛" / "사부작사부작 · 하늘빛"(Figma 3256:52642)
 * - 모두 같으면 "4명 모두 '끝까지 본다'"(Figma 3273:37774)
 *
 * 테스터 모드와 상관없이 그린다 — 테스터가 보낸 카드는 같은 방의 일반 회원에게도 간다.
 */
export function ChatQuizCardView({
  card,
  myUserId,
  nameOf,
  myChoiceId,
  prompt,
}: ChatQuizCardViewProps) {
  const unanimous = unanimousChoice(card.choices);

  return (
    <Card data-cy="chat-quiz-card">
      <Question>
        Q{card.order}. {card.question}
      </Question>
      {unanimous ? (
        <Unanimous>
          {unanimous.memberCount}명 모두 &lsquo;{unanimous.content}&rsquo;
        </Unanimous>
      ) : (
        <ChatQuizChips chips={toQuizChips(card.choices, { myUserId, nameOf, myChoiceId })} />
      )}
      {prompt && <Prompt>{prompt}</Prompt>}
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  max-width: 100%;
  padding: var(--space-4) calc(var(--space-4) + var(--spacing-2px));
  box-sizing: border-box;
  border-radius: var(--space-3);
  background-color: var(--color-semantic-static-white);
  text-align: center;
`;

const Question = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
  color: var(--color-semantic-label-normal);
  word-break: keep-all;
  font-feature-settings: "ss10" 1;
`;

const Unanimous = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-status-positive);
  font-feature-settings: "ss10" 1;
`;

const Prompt = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
  word-break: keep-all;
  font-feature-settings: "ss10" 1;
`;
