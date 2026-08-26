describe("public routes", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
  });

  it("renders the landing screen", () => {
    cy.visit("/");

    cy.contains("퀴즈로 만나는 새로운 인연", { timeout: 6000 }).should("be.visible");
    cy.contains("매주 색다른 퀴즈를 풀어요").should("be.visible");
  });

  // 랜딩은 한 화면에 딱 맞아야 한다. TmpContainer가 box-sizing 없이 100dvh + padding-top
  // 이었을 때 실제 높이가 화면을 넘겨 스크롤이 생겼다(전역 box-sizing 리셋이 없다).
  it("fits the landing screen without scrolling", () => {
    cy.visit("/");
    cy.contains("퀴즈로 만나는 새로운 인연", { timeout: 6000 }).should("be.visible");

    cy.document().then((doc) => {
      const overflow = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
      // 반올림 오차만 허용한다.
      expect(overflow, "세로 넘침(px)").to.be.lessThan(2);
    });
  });

  it("renders the local login screen", () => {
    cy.mockApi();
    cy.visit("/localogin");

    cy.contains("로컬 로그인").should("be.visible");
    cy.contains("button", "로그인").should("be.visible");
  });
});
