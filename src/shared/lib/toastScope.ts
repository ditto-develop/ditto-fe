/**
 * 토스트가 자기를 띄운 화면에 묶여 있는지 판단한다.
 *
 * 액션 버튼이 달렸거나 스스로 사라지지 않는 토스트는 그 화면의 일부다. 화면을 벗어난 뒤에도
 * 떠 있으면 눌러도 아무 일이 일어나지 않고(핸들러가 사라진 화면을 가리킨다), 사용자는 지금
 * 화면과 무관한 문구를 보게 된다. 그래서 화면이 바뀌면 같이 걷어낸다.
 *
 * 반대로 자동으로 사라지는 안내 토스트는 화면에 묶지 않는다.
 * "저장 → 이전 화면으로 이동 → 저장됐어요" 처럼 이동 직전에 띄우는 흐름이 있어서,
 * 이동과 동시에 지우면 사용자는 결과를 보지 못한다.
 */

/** `showToast` 가 `duration` 을 받지 않았을 때 쓰는 기본 노출 시간(ms). */
export const DEFAULT_TOAST_DURATION = 3000;

export interface ToastScopeInput {
  /** ms. 0 이하이면 액션/닫기 전까지 계속 떠 있는다. */
  duration?: number;
  actionLabel?: unknown;
  actionIcon?: unknown;
  onAction?: unknown;
}

/**
 * 스스로 사라지지 않는 토스트(`duration <= 0`).
 *
 * 이건 토스트를 띄운 **컴포넌트**에 묶인다. 온보딩 단계 전환처럼 라우트는 그대로인데
 * 화면만 바뀌어도, 남겨 두면 아무도 걷어 주지 않아 영영 떠 있는다.
 */
export function isStickyToast(options?: ToastScopeInput): boolean {
  return (options?.duration ?? DEFAULT_TOAST_DURATION) <= 0;
}

/**
 * 라우트에 묶인 토스트 — 스스로 안 사라지거나, 액션 버튼이 달린 것.
 *
 * 액션이 달렸어도 시간이 정해져 있으면 컴포넌트가 사라지는 것만으로 걷지는 않는다.
 * "참여했어요 [확인]" 처럼 결과를 알리고 그 자리에서 화면이 갱신되는 흐름이 있어서,
 * 마운트 해제까지 기준으로 삼으면 사용자가 결과를 보지 못한다.
 */
export function isScreenBoundToast(options?: ToastScopeInput): boolean {
  if (options?.actionLabel || options?.actionIcon || options?.onAction) return true;
  return isStickyToast(options);
}
