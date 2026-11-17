"use client";

import { CardContainer, DecoImg } from "@/components/display/Card";
import { ActionButton } from "@/components/input/Action";
import type { SecretMatchingCardState, SecretRoundDay } from "@/features/matching/model/secretMatching";
import { trackCardClick, useCardImpression } from "@/shared/lib/analytics";
import { Body2Reading, Headline1 } from "@/shared/ui";

import { ActionContainer, CenteredTextBlock, FailMatch, RandomImg } from "./MatchingDay.styles";

/**
 * 시크릿 매칭(IMP-2) 홈 카드 — 시안 A·B·C·D. 레이아웃은 기존 "진행 중인 매칭이 없어요" 카드(FailMatchCard)를
 * 그대로 쓴다: 제목 → 일러스트 → 본문 → (CTA). 상단 타임라인은 건드리지 않는다.
 *
 * 문구에 '패자부활전'을 쓰지 않는다(내부명). 요일은 서버가 준 다음 라운드 시각으로 정한다(`toSecretRoundDay`) —
 * 모르면 "금·토"로 쓴다.
 */

type CardCopy = {
  title: string;
  lines: [string, string];
  illustration: string;
  cta?: string;
};

function copyOf(state: SecretMatchingCardState, roundDay: SecretRoundDay | null): CardCopy {
  const when = `${roundDay ?? "금·토"} 저녁 8시`;
  switch (state) {
    case "ELIGIBLE":
      return {
        title: "시크릿 매칭 기회가 있어요",
        lines: ["이번 주 1:1 퀴즈를 풀면", `${when} 시크릿 매칭에 참여할 수 있어요.`],
        illustration: "/assets/illustration/quizstart.svg",
        cta: "퀴즈 풀어보기",
      };
    case "WAITING":
      return {
        title: "시크릿 매칭을 기다리고 있어요",
        lines: [`${when}에 결과가 나와요.`, "매칭되면 바로 알려드릴게요."],
        illustration: "/assets/illustration/quizpeople.svg",
      };
    case "AUTO_ENTERED":
      return {
        title: "시크릿 매칭 기회가 있어요",
        lines: ["이번엔 인연이 닿지 않았지만", `${when} 시크릿 매칭에 자동으로 참여해요.`],
        illustration: "/assets/illustration/quizpeople.svg",
      };
    case "ENDED":
      return {
        title: "진행 중인 매칭이 없어요.",
        lines: ["이번 주 매칭은 모두 끝났어요.", "기다리는 동안 지난 퀴즈를 풀어보세요."],
        illustration: "/assets/illustration/empty-state.png",
        cta: "지난 퀴즈 풀어보기",
      };
  }
}

/** 클릭률 집계용 카드 상태 이름. 기존 matching 카드와 같은 축에 `secret_` 접두로 나란히 놓는다. */
const CARD_STATE_NAME: Record<SecretMatchingCardState, string> = {
  ELIGIBLE: "secret_eligible",
  WAITING: "secret_waiting",
  AUTO_ENTERED: "secret_auto_entered",
  ENDED: "secret_ended",
};

export function SecretMatchingCard({
  state,
  roundDay,
  onStartQuiz,
  onOpenRecords,
}: {
  state: SecretMatchingCardState;
  roundDay: SecretRoundDay | null;
  /** ELIGIBLE 의 [퀴즈 풀어보기]. 바텀시트 없이 1:1 퀴즈로 바로 간다. */
  onStartQuiz?: () => void;
  /** ENDED 의 [지난 퀴즈 풀어보기] → 기록 탭. */
  onOpenRecords?: () => void;
}) {
  const copy = copyOf(state, roundDay);
  const cardState = CARD_STATE_NAME[state];
  useCardImpression("matching", cardState);

  const onCta = state === "ELIGIBLE" ? onStartQuiz : state === "ENDED" ? onOpenRecords : undefined;

  return (
    <CardContainer data-testid="secret-matching-card" data-state={state}>
      <DecoImg src="/display/deco.svg" alt="" />
      <FailMatch>
        <Headline1 $weight="bold" $align="center">
          {copy.title}
        </Headline1>
        <RandomImg src={copy.illustration} alt="" loading="lazy" />
        <CenteredTextBlock>
          {copy.lines.map((line) => (
            <Body2Reading key={line} $color="var(--color-semantic-label-alternative)">
              {line}
            </Body2Reading>
          ))}
        </CenteredTextBlock>
        {copy.cta && onCta && (
          <ActionContainer>
            <ActionButton
              onClick={() => {
                trackCardClick("matching", cardState, state === "ELIGIBLE" ? "start_quiz" : "open_records");
                onCta();
              }}
            >
              {copy.cta}
            </ActionButton>
          </ActionContainer>
        )}
      </FailMatch>
    </CardContainer>
  );
}
