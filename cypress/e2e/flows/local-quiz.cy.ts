describe("local quiz test flow", () => {
  beforeEach(() => {
    cy.mockApi();
    const quizPeriodSystemState = {
      statusCode: 200,
      body: {
        success: true,
        data: {
          year: 2026,
          month: 6,
          week: 1,
          period: "QUIZ_PERIOD",
        },
      },
    };
    cy.intercept("GET", "**/api/system/state", quizPeriodSystemState).as("getQuizPeriodSystemState");
    cy.intercept("GET", "**/api/v1/system/state", quizPeriodSystemState).as("getQuizPeriodSystemStateV1");
  });

  it("opens the quiz-period home state and completes the current quiz", () => {
    cy.login();
    cy.visit("/home");

    cy.wait("@getQuizPeriodSystemState");
    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    cy.contains("참여 가능").should("be.visible");

    cy.contains("button", "시작하기").click();
    cy.contains("퀴즈의 종류를 선택하세요", { timeout: 6000 }).should("be.visible");
    cy.contains("성격, 가치관").click();

    cy.location("pathname", { timeout: 6000 }).should("match", /^\/quiz\/current\/?$/);
    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("button", "미리 계획 세우기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");

    cy.contains("퀴즈 참여 완료", { timeout: 6000 }).should("be.visible");
  });
});
