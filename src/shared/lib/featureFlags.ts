/**
 * 공개 전 기능 플래그 — 새 화면을 프로덕션에 먼저 올려 두고 우리(테스터)만 확인한 뒤 공개한다(2026-11-03).
 *
 * staging 이 없어서(CLAUDE.md §13.0) 실데이터로 확인할 곳이 프로덕션뿐이다. 그래서 공개 전 기능을
 * 숨긴 채 배포하고, 홈 상단 로고를 7번 연달아 누른 기기에서만 보이게 한다("테스터 모드").
 * 다시 7번 누르면 꺼진다. 기기(localStorage) 단위라 앱을 지우거나 저장소를 비우면 꺼진다.
 *
 * - 화면을 가릴 뿐 접근 제어가 아니다. 번들에 코드가 들어 있고, 7번 누르는 법을 알면 누구나 켤 수 있다.
 * - API 를 막지 않는다. 새 기능이 부르는 BE API 는 프로덕션 BE 에 먼저 떠 있어야 한다.
 * - 쓰는 법은 CLAUDE.md §9.1. 화면에서는 `@/shared/lib/hooks/useFeatureFlag` 의 훅을 쓴다.
 */

/** `tester`: 테스터 모드 기기에서만 보인다. `all`: 모두에게 보인다(공개). */
export type FeatureStage = "tester" | "all";

/**
 * 공개 전 기능 목록. 키 하나가 기능 하나다.
 *
 * 공개할 때는 값을 `"all"` 로 바꿔 배포하고, 다음 정리 때 키와 분기를 함께 지운다 — 키를 지우면
 * `useFeatureFlag("키")` 를 부르던 곳이 전부 타입 에러가 나므로 남은 분기를 빠짐없이 찾을 수 있다.
 */
export const FEATURES = {
  /**
   * 8.1 퀴즈 기록 — 하단 "기록" 탭(/records)과 대화방의 "우리의 답변"(요약 바·문서 아이콘·질문 보내기).
   * 부르는 BE API 는 서버 IMP-1(ditto-server #366, 서버 위키 IMP-1-Quiz-History-Answer-Compare)이다.
   * 첫 대화 힌트·질문 카드 메시지는 이 플래그와 무관하다 — 서버 `QUIZ_CHAT` 플래그가 켜지면 모두에게 온다.
   */
  records: "tester",
} as const satisfies Record<string, FeatureStage>;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * 플래그의 단계. 반환형을 `FeatureStage` 로 넓혀 둔다 — `FEATURES` 는 `as const` 라 그대로 읽으면
 * 리터럴 타입("tester")으로 좁혀져, 모든 키가 같은 단계일 때 `stage === "all"` 이 타입 에러가 된다.
 */
export function featureStage(flag: FeatureFlag): FeatureStage {
  return FEATURES[flag];
}

export function isStageVisible(stage: FeatureStage, testerMode: boolean): boolean {
  return stage === "all" || testerMode;
}

/** Cypress `cy.enableTesterMode()` 도 이 키를 쓴다(cypress/support/commands.ts). */
export const TESTER_MODE_STORAGE_KEY = "ditto.testerMode";

const TESTER_MODE_CHANGE_EVENT = "ditto:tester-mode-change";

/** 저장소 접근은 언제든 throw 할 수 있다(프라이빗 창 등). 못 읽으면 꺼진 것으로 본다. */
export function readTesterMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TESTER_MODE_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setTesterMode(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(TESTER_MODE_STORAGE_KEY, "on");
    else window.localStorage.removeItem(TESTER_MODE_STORAGE_KEY);
  } catch {
    // 못 적으면 이번 실행에서만 바뀌지 않는다. 화면을 막을 일은 아니다.
  }
  window.dispatchEvent(new Event(TESTER_MODE_CHANGE_EVENT));
}

/** useSyncExternalStore 용. 같은 탭의 토글은 커스텀 이벤트로, 다른 탭의 토글은 storage 이벤트로 받는다. */
export function subscribeTesterMode(listener: () => void): () => void {
  window.addEventListener(TESTER_MODE_CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(TESTER_MODE_CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** 몇 번 눌러야 토글되는지. */
export const SECRET_TAP_COUNT = 7;

/** 직전 탭과 이보다 오래 떨어지면 처음부터 다시 센다. */
export const SECRET_TAP_GAP_MS = 1000;

export type TapState = { count: number; lastAt: number };

export const INITIAL_TAP_STATE: TapState = { count: 0, lastAt: 0 };

export function nextTapState(prev: TapState, now: number): TapState {
  const continued = prev.count > 0 && now - prev.lastAt <= SECRET_TAP_GAP_MS;
  return { count: continued ? prev.count + 1 : 1, lastAt: now };
}
