"use client";

import { useEffect, useRef } from "react";

import type { CardName } from "@/shared/lib/analytics/events";
import { trackEvent } from "@/shared/lib/analytics/gtag";

/**
 * 홈 카드의 노출을 한 번 기록한다. **클릭률의 분모다.**
 *
 * 클릭만 세면 "몇 명이 눌렀나"는 알아도 "본 사람 중 몇 %가 눌렀나"는 알 수 없다.
 * 기간마다 뜨는 카드가 다르므로(퀴즈 기간엔 퀴즈 카드, 매칭 기간엔 매칭 카드),
 * 전역 파라미터로 붙는 `period` 와 함께 보면 기간별 클릭률이 그대로 나온다.
 *
 * 같은 상태를 두 번 세지 않는다 — 부모 리렌더나 개발 모드의 StrictMode 이중 호출로
 * 분모만 부풀면 클릭률이 실제보다 낮게 보인다. 카드 **상태**가 바뀌면
 * (예: 퀴즈 미참여 → 참여 완료) 다른 카드를 보여 주는 것이므로 새 노출로 센다.
 *
 * @param cardState 없으면(=아직 판정 전) 아무것도 보내지 않는다. 로딩 중 스켈레톤을
 *                  노출로 세면 분모가 통째로 어긋난다.
 */
export function useCardImpression(cardName: CardName, cardState: string | null): void {
  const reported = useRef<string | null>(null);

  useEffect(() => {
    if (cardState === null) return;
    const key = `${cardName}:${cardState}`;
    if (reported.current === key) return;
    reported.current = key;
    trackEvent("card_impression", { card_name: cardName, card_state: cardState });
  }, [cardName, cardState]);
}

/** 카드 CTA 클릭. 클릭률의 분자다. */
export function trackCardClick(cardName: CardName, cardState: string, action: string): void {
  trackEvent("card_click", { card_name: cardName, card_state: cardState, action });
}
