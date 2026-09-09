/**
 * 화면 안 "뒤로" 버튼용 내비게이션 헬퍼.
 *
 * 뒤로 버튼을 `router.push("/home")` 으로 구현하면 히스토리가 **줄지 않고 쌓인다**.
 * 그러면 그 직후 OS 뒤로가기를 한 사용자가 방금 빠져나온 화면으로 되돌아가고,
 * 다시 뒤로 버튼을 누르면 또 홈이 쌓여 뒤로가기가 영원히 끝나지 않는다.
 * 뒤로 버튼은 히스토리를 **소비**해야 한다.
 */

/** `next/navigation` 의 라우터에서 이 헬퍼가 쓰는 부분만 구조적으로 받는다. */
type BackCapableRouter = {
  back: () => void;
  replace: (href: string) => void;
};

/**
 * 히스토리가 있으면 뒤로 가고, 없으면 `fallback` 으로 대체한다.
 *
 * 앱(웹뷰)은 항상 루트를 먼저 열기 때문에 실질적으로 늘 `back()` 이 된다.
 * fallback 은 웹에서 해당 URL 을 직접 열어 히스토리가 한 칸뿐인 경우를 위한 것이다 —
 * 그 상태에서 `back()` 만 부르면 버튼이 아무 반응도 하지 않는다.
 */
export function goBackOr(router: BackCapableRouter, fallback: string): void {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }
  router.replace(fallback);
}
