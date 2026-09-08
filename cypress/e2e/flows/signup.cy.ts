// Signup E2E: bypasses Kakao OAuth by visiting the callback URL directly
// with signupRequired=true, which puts Tutorial into the first signup step.
//
// 본인인증 스텝을 없애 온보딩은 2단계다(2026-08-30): 프로필 작성 → 소개 노트.
// 나이는 생년월일 입력에서 계산하며 만 19세 미만은 여기서 막힌다.

const OAUTH_ENTRY = "/oauth/kakao?accessToken=e2e-token&refreshToken=e2e-refresh&signupRequired=true";

/** 만 19세를 넉넉히 넘는 생년월일. 기준 시각이 흘러도 계속 성인이다. */
const ADULT_BIRTH_DATE = "1998-03-15";
/** 만 19세 미만. 연령 게이트 검증용. */
const MINOR_BIRTH_DATE = "2015-03-15";

function selectFromBottomSheet(labelText: string, optionText: string) {
  cy.get(`button[aria-label="${labelText}"]`).click();
  cy.contains("li", optionText, { timeout: 4000 }).click();
}

/**
 * 생년월일 바텀시트: input[type=date] 대신 연/월/일 네이티브 select 3개 + 확인 버튼이다
 * (일부 인앱 웹뷰에서 input[type=date]는 탭해도 피커가 뜨지 않았다).
 */
function selectBirthDate(birthDate: string) {
  const [year, month, day] = birthDate.split("-").map(Number);
  cy.get('button[aria-label="생년월일"]').click();
  cy.get('select[aria-label="연도"]', { timeout: 4000 }).select(String(year));
  cy.get('select[aria-label="월"]').select(String(month));
  cy.get('select[aria-label="일"]').select(String(day));
  cy.contains("button", "확인").click();
}

/** 카카오가 이메일을 주지 않으므로 가입 폼에서 직접 받는다(2026-09-06). */
const EMAIL = "e2e@example.com";

function fillProfile(birthDate: string = ADULT_BIRTH_DATE) {
  // Nickname
  cy.get('input[placeholder="사용할 닉네임을 입력해주세요"]').type("테스트닉");
  cy.contains("button", "저장").click();
  cy.wait("@checkNickname");

  // Email
  cy.get('input[placeholder="이메일을 입력해주세요"]').type(EMAIL);

  // Gender, Birth date
  selectFromBottomSheet("성별", "남자");
  selectBirthDate(birthDate);

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

  it("renders the profile step when entering via oauth callback with signupRequired=true", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    cy.contains("디토는 만 19세 이상만 참여할 수 있어요.").should("be.visible");
    // 본인인증 스텝은 사라졌다.
    cy.contains("간편하게 인증하기").should("not.exist");
    cy.contains("1/2단계").should("be.visible");
  });

  it("blocks the profile step when required fields are empty", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "다음").click();

    cy.contains("프로필 작성하기").should("be.visible");
    cy.contains("소개 노트 작성하기").should("not.exist");
  });

  it("blocks the profile step when the email is malformed", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    fillProfile();
    // 형식이 깨진 값으로 덮어쓴다. 카카오가 이메일을 주지 않으므로 여기가 유일한 수집 경로다.
    cy.get('input[placeholder="이메일을 입력해주세요"]').clear().type("not-an-email");
    cy.contains("button", "다음").click();

    cy.contains("이메일 형식이 올바르지 않아요.", { timeout: 6000 }).should("be.visible");
    cy.contains("소개 노트 작성하기").should("not.exist");
  });

  it("blocks signup when the user is under 19", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    fillProfile(MINOR_BIRTH_DATE);
    cy.contains("button", "다음").click();

    cy.contains("만 19세 이상만 가입할 수 있어요.", { timeout: 6000 }).should("be.visible");
    cy.contains("소개 노트 작성하기").should("not.exist");
  });

  it("advances to the intro note step when the profile is complete", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    fillProfile();
    cy.contains("button", "다음").click();

    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");
    cy.contains("2/2단계").should("be.visible");
  });

  it("completes signup when user skips intro notes", () => {
    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 });
    fillProfile();
    cy.contains("button", "다음").click();

    cy.contains("소개 노트 작성하기", { timeout: 6000 });
    cy.contains("button", "다음에 할래요").click();

    // Confirmation toast appears — click 확인 to proceed
    cy.contains("확인", { timeout: 4000 }).click();

    cy.wait("@createUser").its("request.body").should((body) => {
      // 전화번호는 수집하지 않으므로 항상 null 이고, 나이는 생년월일에서 계산한 연령대다.
      expect(body.phoneNumber, "phoneNumber").to.equal(null);
      expect(body.age, "age").to.be.a("number").and.to.be.at.least(20);
      expect(body.birthDate, "birthDate").to.contain(ADULT_BIRTH_DATE);
      // 이름은 더 이상 싣지 않고, 이메일은 폼 입력값이 그대로 나간다(2026-09-06).
      expect(body, "name").to.not.have.property("name");
      expect(body.email, "email").to.equal(EMAIL);
    });
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/onboarding\/complete\/?$/);
    cy.contains("만남 준비 완료!", { timeout: 6000 }).should("be.visible");
    clickNavigationButton("시작하기");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
  });

  it("shows error toast when signup API fails", () => {
    cy.intercept("POST", "**/api/**/users", { statusCode: 500, body: {} }).as("createUserFail");

    cy.visit(OAUTH_ENTRY);

    cy.contains("프로필 작성하기", { timeout: 6000 });
    fillProfile();
    cy.contains("button", "다음").click();

    cy.contains("소개 노트 작성하기", { timeout: 6000 });
    cy.contains("button", "다음에 할래요").click();
    cy.contains("확인", { timeout: 4000 }).click();

    cy.wait("@createUserFail");
    cy.contains("회원가입 중 문제가 발생했어요.", { timeout: 6000 }).should("be.visible");
  });
});
