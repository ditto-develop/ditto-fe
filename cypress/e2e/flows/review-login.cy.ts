/**
 * App Store 심사용 데모 로그인 고정 테스트.
 *
 * 리뷰어는 카카오·애플 인증을 대신 통과할 수 없어서, 로그인 첫 화면 로고를 5번 연달아
 * 누르면 열리는 시트로 심사 계정에 들어간다. 이 진입 방법은 App Store Connect 심사 노트에
 * 적혀 있으므로 바뀌면 심사가 막힌다 — 탭 횟수까지 못박는다.
 *
 * 서버 응답은 가로챈다. 계정 값은 BE 환경변수라 E2E 가 알 수 없다.
 */
const KAKAO_BUTTON = "카카오로 계속하기";
const REVIEW_LOGIN = "**/api/v1/users/review-login";

const tapLogo = (times: number) => {
  for (let i = 0; i < times; i += 1) {
    cy.get('[data-testid="landing-logo"]').click();
  }
};

const fillAndSubmit = () => {
  cy.get('input[name="loginId"]').type("appreview");
  cy.get('input[name="password"]').type("review-password");
  cy.contains("button", "로그인").click();
};

describe("심사용 데모 로그인", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
    // 비로그인 첫 화면은 3초 스플래시가 덮는다. 걷힌 뒤를 본다.
    cy.contains("p", KAKAO_BUTTON, { timeout: 10000 }).should("be.visible");
  });

  it("로고를 4번만 누르면 열리지 않는다", () => {
    tapLogo(4);

    cy.contains("심사용 로그인").should("not.exist");
  });

  it("로고를 5번 누르면 열리고, 로그인하면 홈으로 간다", () => {
    cy.intercept("POST", REVIEW_LOGIN, {
      body: {
        success: true,
        data: { accessToken: "review-access-token", signupRequired: false, sanctioned: false },
        error: null,
      },
    }).as("reviewLogin");

    tapLogo(5);
    cy.contains("심사용 로그인").should("be.visible");
    fillAndSubmit();

    cy.wait("@reviewLogin")
      .its("request.body")
      .should("deep.equal", { loginId: "appreview", password: "review-password" });
    cy.location("pathname", { timeout: 10000 }).should("match", /^\/home\/?$/);
  });

  it("값이 틀리면(1005) 시트에 머물고 안내한다", () => {
    cy.intercept("POST", REVIEW_LOGIN, {
      body: {
        success: false,
        data: null,
        error: { statusCode: 401, code: "1005", message: "심사용 로그인 정보가 올바르지 않습니다." },
      },
    }).as("reviewLogin");

    tapLogo(5);
    fillAndSubmit();

    cy.wait("@reviewLogin");
    cy.contains("아이디 또는 비밀번호가 올바르지 않아요.").should("be.visible");
    cy.location("pathname").should("match", /^\/?$/);
  });
});
