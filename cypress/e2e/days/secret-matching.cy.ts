/**
 * IMP-2 시크릿 매칭 — 금·토 20:00 1:1 추가 라운드(ditto-server ADR 0053·0054, 위키 Frontend-Secret-Matching-Guide).
 *
 * 서버 기능 플래그 `SECRET_MATCHING` 이 켜져 있거나 테스터 모드면 보인다(CLAUDE.md §9.1). 홈 상태는 서버가 정해 주고
 * (GET /matching/secret-state), 화면은 그 상태로만 갈린다. 시계는 토요일 정오(KST, cy.clockPeriod("CHATTING"))라
 * fixture 의 다음 라운드("2026-06-06 20:00:00", 시간대 표기 없는 KST)가 "토요일"로 보여야 한다.
 */

const SECRET_CLOSED_CODE = "4007";
const OTHER_TYPE_COMPLETED_CODE = "4005";

function failure(code: string, statusCode: number) {
  return { statusCode, body: { success: false, data: null, error: { code, message: code, statusCode } } };
}

function visitHomeWith(secretMatchingFixture: string, extra: Partial<Parameters<typeof cy.mockApi>[0]> = {}) {
  cy.clockPeriod("CHATTING");
  cy.mockApi({ secretMatchingFixture, ...extra });
  cy.login();
  cy.visit("/home");
}

describe("시크릿 매칭 홈 카드", () => {
  it("퀴즈를 안 풀었으면 기회 카드에서 바텀시트 없이 1:1 퀴즈로 바로 가고, 완료 화면이 토요일 라운드를 알린다", () => {
    visitHomeWith("secret-matching-eligible.json");

    cy.contains("시크릿 매칭 기회가 있어요", { timeout: 6000 }).should("be.visible");
    cy.contains("토요일 저녁 8시 시크릿 매칭에 참여할 수 있어요.").should("be.visible");
    // 상단 타임라인은 그대로다.
    cy.contains("타임라인").should("be.visible");

    cy.contains("button", "퀴즈 풀어보기").click();
    cy.contains("퀴즈의 종류를 선택하세요").should("not.exist");
    cy.location("pathname").should("match", /^\/quiz\/current\/?$/);
    cy.location("search").should("include", "quizSetId=101").and("include", "type=ONE_TO_ONE");

    // 목~일에는 current-week 가 비어 있다 — 셋을 직접 읽는다. 이어풀기 안내("새로 풀기")는 뜨지 않는다.
    cy.wait("@getQuizSetWithProgress");
    // 완료 화면의 요일은 마지막 문항 제출 뒤 다시 읽은 상태로 고른다(서버 가이드 §2).
    cy.fixture("secret-matching-waiting.json").then((data: unknown) => {
      cy.intercept("GET", "**/api/v1/matching/secret-state*", { success: true, data, error: null }).as(
        "getSecretStateAfterSubmit",
      );
    });
    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.wait("@getSecretStateAfterSubmit");

    cy.contains("퀴즈 참여 완료", { timeout: 6000 }).should("be.visible");
    cy.contains("토요일 저녁 8시에 시크릿 매칭 결과가 공개돼요.").should("be.visible");
    cy.contains("목요일에 매칭 결과가 공개돼요.").should("not.exist");
  });

  it("제출 후에는 대기 카드에 다음 라운드 요일이 보인다", () => {
    visitHomeWith("secret-matching-waiting.json");

    cy.contains("시크릿 매칭을 기다리고 있어요", { timeout: 6000 }).should("be.visible");
    cy.contains("토요일 저녁 8시에 결과가 나와요.").should("be.visible");
    cy.contains("button", "퀴즈 풀어보기").should("not.exist");
  });

  it("1:1 미매칭이면 다음 라운드 자동 참여를 알리고 버튼은 없다", () => {
    visitHomeWith("secret-matching-auto-entered.json");

    cy.contains("이번엔 인연이 닿지 않았지만", { timeout: 6000 }).should("be.visible");
    cy.contains("토요일 저녁 8시 시크릿 매칭에 자동으로 참여해요.").should("be.visible");
    cy.get('[data-testid="secret-matching-card"] button').should("not.exist");
  });

  it("목요일 정규 후보가 있으면 서버가 자동 참여(AUTO_ENTERED)를 줘도 정규 결과 카드를 그대로 둔다", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({
      secretMatchingFixture: "secret-matching-auto-entered.json",
      matchesFixture: "matches-1on1-populated.json",
    });
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("결과 확인").should("be.visible");
    cy.get('[data-testid="secret-matching-card"]').should("not.exist");
    cy.contains("이번엔 인연이 닿지 않았지만").should("not.exist");
  });

  it("토 20:00 라운드 뒤에는 종료 카드에서 기록 탭으로 간다", () => {
    visitHomeWith("secret-matching-ended.json");

    cy.contains("이번 주 매칭은 모두 끝났어요.", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "지난 퀴즈 풀어보기").click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/records\/?$/);
  });

  it("시크릿 라운드가 후보를 주면 기존 후보 카드를 쓰고, 결과 화면 머리글과 시크릿 후보 표시가 바뀐다", () => {
    visitHomeWith("secret-matching-secret-result.json", {
      matchesFixture: "matches-1on1-secret.json",
      matchingStatusFixture: "matching-status.json",
    });

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("결과 확인").should("be.visible");
    cy.contains("진행 중인 대화가 없어요.").should("not.exist");

    cy.contains("button", "대화 신청하기").click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/matching\/?$/);
    cy.contains("시크릿 매칭 결과", { timeout: 6000 }).should("be.visible");
    cy.contains("나와 비슷한 답을 한 사람들을 다시 찾았어요.").should("be.visible");
    cy.get('[data-testid="secret-matching-notice"]').should("contain.text", "서로 선택하면 바로 대화가 열려요 · 일요일 밤까지");

    // 목요일 정규 후보(지우)와 시크릿 후보(수민)가 한 목록이고, 시크릿 후보에만 표시가 붙는다(SM-06).
    cy.contains("수민").should("be.visible");
    cy.contains("지우").should("be.visible");
    cy.get('[data-testid="secret-candidate-badge"]').should("have.length", 1).and("contain.text", "시크릿");
  });

  it("그룹 주에 늦게 푼 1:1 이 성사되면(서버 NONE) 그룹 '매칭 없음' 대신 1:1 대화 카드를 그린다", () => {
    visitHomeWith("secret-matching-none.json", {
      groupMatchesFixture: "matches-group.json",
      matchesFixture: "matches-1on1-secret.json",
      matchingStatusFixture: "matching-status-accepted.json",
    });

    cy.contains("수민", { timeout: 6000 }).should("be.visible");
    cy.contains("진행 중인 대화가 없어요.").should("not.exist");
    cy.get('[data-testid="secret-matching-card"]').should("not.exist");
  });

  /**
   * 그룹 초대에 답하지 않은 그룹 완주자는 `NONE` 이지만, 거절하면 그 자리에서 1:1 을 풀 수 있어 서버가
   * `ELIGIBLE` 을 준다(ditto-server #393·#397). 기획의 "거절 직후 홈 카드를 SM-01 로"는 그룹 화면이 아니라
   * 이 서버 상태로 띄운다 — 그래서 거절하면 시크릿 상태를 다시 읽어야 한다.
   */
  it("그룹 초대를 거절하면 시크릿 상태를 다시 읽어 기회 카드로 바꾼다", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({
      secretMatchingFixture: "secret-matching-none.json",
      groupMatchesFixture: "matches-group.json",
    });
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.get('[data-testid="secret-matching-card"]').should("not.exist");
    cy.contains("대화 신청하기").click();

    cy.fixture("secret-matching-eligible.json").then((data: unknown) => {
      cy.intercept("GET", "**/api/v1/matching/secret-state*", { success: true, data, error: null }).as(
        "getSecretStateAfterDecline",
      );
    });
    cy.contains("button", "거절하기", { timeout: 6000 }).click({ force: true });
    cy.contains("네, 거절할게요").click();
    cy.wait("@declineGroupMatch");
    cy.wait("@getSecretStateAfterDecline");

    cy.contains("시크릿 매칭 기회가 있어요", { timeout: 6000 }).should("be.visible");
    cy.contains("진행 중인 매칭이 없어요").should("not.exist");
  });
});

describe("시크릿 매칭 플래그", () => {
  it("서버 플래그가 꺼져 있으면 상태를 묻지 않고 지금 화면 그대로다", () => {
    cy.clockPeriod("CHATTING");
    cy.mockApi({ secretMatchingFixture: "secret-matching-eligible.json" });
    cy.mockFeatureFlags({ SECRET_MATCHING: false });
    cy.login();
    cy.visit("/home");

    cy.contains("진행 중인 대화가 없어요.", { timeout: 6000 }).should("be.visible");
    cy.contains("시크릿 매칭 기회가 있어요").should("not.exist");
    cy.get("@getSecretMatchingStatus.all").should("have.length", 0);
  });

  it("서버 플래그가 꺼져 있어도 테스터 모드면 보인다", () => {
    cy.clockPeriod("CHATTING");
    cy.mockApi({ secretMatchingFixture: "secret-matching-eligible.json" });
    cy.mockFeatureFlags({ SECRET_MATCHING: false });
    cy.login();
    cy.enableTesterMode();
    cy.visit("/home");

    cy.contains("시크릿 매칭 기회가 있어요", { timeout: 6000 }).should("be.visible");
  });
});

describe("시크릿 매칭 늦은 응시 제출 거절", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi({ secretMatchingFixture: "secret-matching-eligible.json" });
    cy.login();
  });

  it("토 20:00 이 지나 제출이 거절되면(4007) 토스트로 알리고 홈으로 돌아간다", () => {
    cy.intercept("POST", "**/api/v1/quiz-progress/answers*", failure(SECRET_CLOSED_CODE, 400)).as("submitClosed");
    cy.visit("/quiz/current?type=ONE_TO_ONE&quizSetId=101");

    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitClosed");

    cy.contains("이번 주 시크릿 매칭 참여가 마감됐어요.", { timeout: 6000 }).should("be.visible");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
    cy.contains("퀴즈 참여 완료").should("not.exist");
  });

  it("이번 주에 다른 유형을 이미 완주했으면(4005) 토스트로 알리고 홈으로 돌아간다", () => {
    cy.intercept("POST", "**/api/v1/quiz-progress/answers*", failure(OTHER_TYPE_COMPLETED_CODE, 409)).as(
      "submitOtherType",
    );
    cy.visit("/quiz/current?type=ONE_TO_ONE&quizSetId=101");

    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitOtherType");

    cy.contains("이번 주에는 이미 다른 유형의 퀴즈를 완료했어요.", { timeout: 6000 }).should("be.visible");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
    cy.contains("퀴즈 참여 완료").should("not.exist");
  });

  it("마감 뒤에 퀴즈를 열면 안내 모달을 띄우고 홈으로 보낸다", () => {
    cy.intercept("GET", "**/api/v1/quiz-progress/quiz-sets/*", failure(SECRET_CLOSED_CODE, 400)).as("quizClosed");
    cy.visit("/quiz/current?type=ONE_TO_ONE&quizSetId=101");

    cy.wait("@quizClosed");
    cy.contains("시크릿 매칭이 마감됐어요", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "홈으로").click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
  });
});
