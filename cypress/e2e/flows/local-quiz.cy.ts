describe("local quiz test flow", () => {
  beforeEach(() => {
    // system/state mock과 Date를 퀴즈 기간으로 고정
    cy.clockPeriod("QUIZ");
    cy.mockApi();
  });

  it("opens the quiz-period home state and completes the current quiz", () => {
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    cy.contains("참여 가능").should("be.visible");

    cy.contains("button", "시작하기").click();
    cy.contains("퀴즈의 종류를 선택하세요", { timeout: 6000 }).should("be.visible");
    // 시트의 이름은 퀴즈셋 title 이다(픽스처 101).
    cy.contains("이번 주 1:1 매칭 퀴즈").click();

    cy.location("pathname", { timeout: 6000 }).should("match", /^\/quiz\/current\/?$/);
    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("button", "미리 계획 세우기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");

    cy.contains("퀴즈 참여 완료", { timeout: 6000 }).should("be.visible");
  });

  /**
   * 참여 인원은 실제 수 대신 구간의 아래쪽 끝 + "+"로 보인다(QA 2026-10-26). 예전처럼 실제 수에
   * 50을 더하지 않는다 — 픽스처의 12명은 "62명"이 아니라 "50명+"다.
   */
  it("shows the participant count bucketed by 50", () => {
    cy.login();
    cy.visit("/home");
    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    cy.contains("50명+").should("be.visible");
    cy.contains("62명").should("not.exist");
  });

  it("puts a bucket boundary in the lower bucket", () => {
    cy.fixture("quiz-progress-current.json").then((data: Record<string, unknown>) => {
      cy.intercept("GET", "**/api/v1/quiz-progress/current", {
        statusCode: 200,
        body: { success: true, data: { ...data, participantCount: 151 } },
      }).as("getQuizProgress151");
    });
    cy.login();
    cy.visit("/home");
    cy.wait("@getQuizProgress151");
    cy.contains("150명+", { timeout: 6000 }).should("be.visible");
  });
});
