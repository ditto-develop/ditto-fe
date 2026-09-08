/**
 * 로그인 첫 화면의 Sign in with Apple 고정 테스트.
 *
 * 이 버튼은 기능 하나가 아니라 **심사 통과 조건**이다. App Store 가이드라인 4.8 은
 * 카카오 같은 제3자 로그인으로 계정을 만드는 앱에 동등한 로그인 수단을 하나 더 요구하고,
 * 애플 HIG 는 그 버튼이 다른 소셜 버튼보다 작거나 덜 눈에 띄는 것을 금지한다.
 * 그래서 존재뿐 아니라 **카카오 버튼과 같은 크기**까지 본다.
 *
 * 버튼 노출은 `NEXT_PUBLIC_APPLE_LOGIN_ENABLED` 하나로 갈린다. 프로덕션은 배포
 * 워크플로가, dev·E2E 는 `.env.development` 가 켠다 — 두 곳이 어긋나면 이 테스트가
 * 먼저 깨진다.
 *
 * 누른 뒤를 검증하지 않는 이유: 웹 경로는 `startExternalSocialLogin("APPLE")` 이
 * `window.location` 을 애플 도메인으로 넘기는 것이 전부이고, 그 함수는 Cypress
 * 런타임에서 실제 이동을 막는다(테스트가 외부 도메인으로 끌려가지 않게).
 */
const APPLE_BUTTON = "Apple로 계속하기";
const KAKAO_BUTTON = "카카오로 계속하기";

describe("애플 로그인 진입", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("비로그인 첫 화면에 애플 버튼이 카카오 버튼과 같은 크기로 보인다", () => {
    cy.visit("/");

    // 비로그인 첫 화면은 3초 스플래시가 덮는다. 걷힌 뒤를 본다.
    cy.contains("p", KAKAO_BUTTON, { timeout: 10000 }).should("be.visible");
    cy.contains("button", APPLE_BUTTON).should("be.visible");

    // 카카오 쪽은 클릭 대상이 `button` 이 아니라 `div` 라 텍스트에서 두 단계
    // 거슬러 올라가야 실제 버튼 상자가 나온다(p → 내부 정렬 div → 버튼 div).
    cy.contains("p", KAKAO_BUTTON)
      .parent()
      .parent()
      .then(($kakao) => {
        const kakao = $kakao[0].getBoundingClientRect();
        cy.contains("button", APPLE_BUTTON).then(($apple) => {
          const apple = $apple[0].getBoundingClientRect();
          // HIG: 애플 버튼이 더 작으면 안 된다. 반올림 오차만 허용한다.
          expect(apple.width).to.be.closeTo(kakao.width, 1);
          expect(apple.height).to.be.closeTo(kakao.height, 1);
        });
      });
  });

  it("카카오·애플이 별도 계정이라는 안내가 버튼 아래에 보인다", () => {
    cy.visit("/");

    // 없으면 "가입했는데 처음부터 다시 하라고 한다"는 문의가 된다(BE 위키 §3).
    cy.contains("이전에 카카오로 시작하셨다면 카카오로 로그인해 주세요.", {
      timeout: 10000,
    }).should("be.visible");
  });

  it("애플 버튼이 들어와도 사업자 정보가 화면 밖으로 밀리지 않는다", () => {
    // 첫 화면은 100dvh + overflow:hidden 이라 아래 항목이 조용히 잘릴 수 있다.
    // 카카오 비즈앱 심사가 보는 자리라 잘리면 그대로 반려 사유다.
    cy.visit("/");

    cy.contains("카운트제로", { timeout: 10000 }).should("be.visible");
    cy.contains("291-39-01610").should("be.visible");
    cy.contains("사업자 정보").should("be.visible");
  });
});
