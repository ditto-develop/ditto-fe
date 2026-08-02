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
