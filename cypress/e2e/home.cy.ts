describe("home", () => {
  it("renders the onboarding entry screen", () => {
    cy.visit("/");

    cy.contains("퀴즈로 연결되는 새로운 만남의 시작").should("be.visible");
    cy.contains("매주 색다른 퀴즈를 풀어요").should("be.visible");
  });
});
