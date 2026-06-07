describe("quiz to matching flow", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
  });

  it("submits the current quiz and reaches the matching empty state", () => {
    cy.visit("/quiz/current");

    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("button", "미리 계획 세우기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");

    cy.contains("퀴즈 참여 완료", { timeout: 6000 }).should("be.visible");

    cy.visit("/matching");
    cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
    cy.contains("요청할 수 있는 후보가 없어요").should("be.visible");
  });
});
