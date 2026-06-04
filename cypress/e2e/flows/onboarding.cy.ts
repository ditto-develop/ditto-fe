describe("onboarding flow", () => {
  it("skips intro note onboarding and returns home", () => {
    cy.mockApi();
    cy.login();
    cy.visit("/onboarding/intro");

    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "다음에 할래요").click();

    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
    cy.get('img[alt="Ditto"]', { timeout: 6000 }).should("be.visible");
  });
});
