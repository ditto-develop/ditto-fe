import "./commands";

/**
 * 카카오 JS SDK(t1.kakaocdn.net)는 cross-origin 스크립트라, 그 안에서 난 예외는
 * 브라우저가 상세 정보를 지우고 `Script error.`로만 전달한다.
 * 로컬/CI처럼 `NEXT_PUBLIC_KAKAO_JS_KEY`가 없는 환경에서는 `Kakao.init(undefined)`가
 * 던지면서, 앱과 무관한 이 예외 하나로 모든 스펙이 실패한다.
 * 서드파티 스크립트의 cross-origin 예외만 무시하고 앱 코드의 예외는 그대로 실패시킨다.
 */
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("Script error")) return false;
  return undefined;
});

/**
 * 홈 첫 진입 시 미평가 유도(usePendingReviewPrompt)는 기본 픽스처의 열린 평가 때문에
 * 모든 홈 스펙을 평가 화면으로 보낸다. 기본으로 "이미 확인함" 상태로 시작하고,
 * 유도 자체를 검증하는 스펙만 `Cypress.env("reviewPrompt", true)` 로 켠다.
 */
Cypress.on("window:before:load", (win) => {
  if (Cypress.env("reviewPrompt")) return;
  try {
    win.sessionStorage.setItem("ditto:review:prompted", "1");
  } catch {
    // 저장소가 막힌 환경에서는 유도가 뜰 수 있다 — 해당 스펙이 알아서 드러낸다.
  }
});
