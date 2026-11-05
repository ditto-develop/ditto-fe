"use client";

import styled from "styled-components";

import { isPairQuizCard } from "@/features/chat/lib/quizMessage";
import type { QuizCardContent } from "@/features/chat/model/types";
import {
  groupChips,
  pairCardChips,
  unanimousGroupChoice,
} from "@/features/records/lib/roomAnswerText";
import { ChatQuizChips } from "@/features/records/ui/ChatQuizChips";

type ChatQuizCardViewProps = {
  card: QuizCardContent;
  /** 1:1 카드는 보낸 사람 기준으로 오므로 보는 사람이 보낸 사람인지 알아야 "나" 를 정한다. */
  sentByMe: boolean;
  /** 1:1 칩의 상대 이름. */
  partnerName: string;
  /** 문항 번호. 카드에는 없어 방 답변을 읽었을 때만(테스터 모드) 붙인다. */
  order?: number | null;
  /** 그룹 칩에서 내 선택지를 밝게 칠 때 쓴다. 모르면 생략 — 모든 칩이 밝게 나온다. */
  myChoiceId?: number | null;
};

/**
 * 질문 카드(messageType QUIZ_CARD). 말풍선 대신 흰 카드로 그린다. 내용은 서버가 보낸 순간 굳힌 값이다.
 * 덧붙인 한마디는 바로 뒤 TEXT 메시지로 따로 온다.
 *
 * - 1:1: "나 · 노을빛" / "사부작사부작 · 하늘빛", 같은 답이면 "둘 다 노을빛"(Figma 3256:52642)
 * - 그룹: "열린 결말 2명" 칩, 모두 같으면 "4명 모두 '끝까지 본다'"(Figma 3273:37774) + 힌트 질문 한 줄
 *
 * 테스터 모드와 상관없이 그린다 — 테스터가 보낸 카드는 같은 방의 일반 회원에게도 간다.
 */
export function ChatQuizCardView({
  card,
  sentByMe,
  partnerName,
  order,
  myChoiceId,
}: ChatQuizCardViewProps) {
  const pair = isPairQuizCard(card);
  const unanimous = pair ? null : unanimousGroupChoice(card.choices);

  return (
    <Card data-cy="chat-quiz-card">
      <Question>
        {order ? `Q${order}. ` : ""}
        {card.question}
      </Question>
      {pair ? (
        <ChatQuizChips chips={pairCardChips(card, sentByMe, partnerName)} />
      ) : unanimous ? (
        <Unanimous>
          {unanimous.count}명 모두 &lsquo;{unanimous.content}&rsquo;
        </Unanimous>
      ) : (
        <ChatQuizChips chips={groupChips(card.choices, myChoiceId)} />
      )}
      {card.hintQuestion && <Prompt>{card.hintQuestion}</Prompt>}
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
