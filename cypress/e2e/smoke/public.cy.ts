describe("public routes", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
  });

  it("renders the landing screen", () => {
    cy.visit("/");

    cy.contains("퀴즈로 만나는 새로운 인연", { timeout: 6000 }).should("be.visible");
    cy.contains("매주 색다른 퀴즈를 풀어요").should("be.visible");
  });

  it("renders the local login screen", () => {
    cy.mockApi();
    cy.visit("/localogin");

    cy.contains("로컬 로그인").should("be.visible");
    cy.contains("button", "로그인").should("be.visible");
  });
});
