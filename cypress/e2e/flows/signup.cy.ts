// Signup E2E: bypasses Kakao OAuth by visiting the callback URL directly
// with signupRequired=true, which puts Tutorial into step-1 mode.

const OAUTH_ENTRY = "/oauth/kakao?accessToken=e2e-token&refreshToken=e2e-refresh&signupRequired=true";

function selectFromBottomSheet(labelText: string, optionText: string) {
  cy.get(`button[aria-label="${labelText}"]`).click();
  cy.contains("li", optionText, { timeout: 4000 }).click();
}

function fillStep1() {
  cy.get('input[placeholder="이름"]').type("이테스트");
  cy.get('input[placeholder="010-0000-0000"]').type("01012345678");
  cy.get('input[placeholder="인증번호를 입력해주세요."]').type("123456");
}

function fillStep2() {
  // Nickname
  cy.get('input[placeholder="사용할 닉네임을 입력해주세요"]').type("테스트닉");
  cy.contains("button", "저장").click();
  cy.wait("@checkNickname");

  // Gender, Age
  selectFromBottomSheet("성별", "남자");
  selectFromBottomSheet("나이", "25 ~ 29");

  // 5 interests
  cy.contains("💪 운동").click();
  cy.contains("🍿 영화/드라마").click();
  cy.contains("💃 공연").click();
  cy.contains("📷 사진").click();
  cy.contains("📚 독서").click();

  // Location, Job
  selectFromBottomSheet("사는 곳", "서울");
  selectFromBottomSheet("직업", "IT/기술");
}

function clickNavigationButton(buttonText: string) {
  cy.contains("button", buttonText, { timeout: 6000 })
    .should("be.visible")
    .then(($button) => {
      $button[0].click();
    });
}

describe("signup flow", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.on("uncaught:exception", () => false);
  });

  it("renders step 1 (identity) when entering via oauth callback with signupRequired=true", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 }).should("be.visible");
    cy.contains("안전한 이용을 위해 최초 1회 본인인증이 필요해요.").should("be.visible");
  });

  it("blocks step 1 → 2 transition when required fields are empty", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "인증했어요").click();

    // Should still be on step 1
    cy.contains("간편하게 인증하기").should("be.visible");
    cy.contains("프로필 작성하기").should("not.exist");
  });

  it("advances from step 1 to step 2 when all fields are filled", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 }).should("be.visible");
    fillStep1();
    cy.contains("button", "인증했어요").click();

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
  });

  it("blocks step 2 → 3 transition when profile is incomplete", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 });
    fillStep1();
    cy.contains("button", "인증했어요").click();

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    // Try to advance without filling anything
    cy.contains("button", "다음").click();

    // Should still be on step 2 (nickname not saved toast or remain)
    cy.contains("프로필 작성하기").should("be.visible");
    cy.contains("소개 노트 작성하기").should("not.exist");
  });

  it("advances from step 2 to step 3 when profile is complete", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 });
    fillStep1();
    cy.contains("button", "인증했어요").click();

    cy.contains("프로필 작성하기", { timeout: 6000 });
    fillStep2();
    cy.contains("button", "다음").click();

    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");
  });

  it("completes signup when user skips intro notes", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 });
    fillStep1();
    cy.contains("button", "인증했어요").click();

    cy.contains("프로필 작성하기", { timeout: 6000 });
    fillStep2();
    cy.contains("button", "다음").click();

    cy.contains("소개 노트 작성하기", { timeout: 6000 });
    cy.contains("button", "다음에 할래요").click();

    // Confirmation toast appears — click 확인 to proceed
    cy.contains("확인", { timeout: 4000 }).click();

    cy.wait("@createUser");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/onboarding\/complete\/?$/);
    cy.contains("만남 준비 완료!", { timeout: 6000 }).should("be.visible");
    clickNavigationButton("시작하기");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
  });

  it("shows error toast when signup API fails", () => {
    cy.intercept("POST", "**/api/**/users", { statusCode: 500, body: {} }).as("createUserFail");

    cy.visit(OAUTH_ENTRY);

    cy.contains("간편하게 인증하기", { timeout: 6000 });
    fillStep1();
    cy.contains("button", "인증했어요").click();

    cy.contains("프로필 작성하기", { timeout: 6000 });
    fillStep2();
    cy.contains("button", "다음").click();

    cy.contains("소개 노트 작성하기", { timeout: 6000 });
    cy.contains("button", "다음에 할래요").click();
    cy.contains("확인", { timeout: 4000 }).click();

    cy.wait("@createUserFail");
    cy.contains("회원가입 중 문제가 발생했어요.", { timeout: 6000 }).should("be.visible");
  });
});
