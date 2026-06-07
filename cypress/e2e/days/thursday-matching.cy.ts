describe("thursday matching day", () => {
  beforeEach(function () {
    cy.clockPeriod("MATCHING");
    cy.mockApi({
      matchesFixture: "matches-1on1-populated.json",
      matchingStatusFixture: this.currentTest?.title.includes("accepted")
        ? "matching-status-accepted.json"
        : "matching-status.json",
    });
    cy.login();
  });

  it("renders the home matching card", () => {
    cy.visit("/home");

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("결과 확인").should("be.visible");
  });

  it("renders the matching candidate list", () => {
    cy.visit("/matching");

    cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
    cy.contains("수민").should("be.visible");
    cy.contains("🌟 당신과 가장 비슷해요").should("be.visible");
    cy.contains("12개중 11개 일치").should("be.visible");
  });

  it("requests a conversation from the matching candidate profile", () => {
    cy.visit("/matching");

    cy.contains("수민", { timeout: 6000 }).click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/profile\/501\/?$/);

    cy.contains("대화 신청하기", { timeout: 6000 }).click();
    cy.contains("대화를 신청할까요?").should("be.visible");
    cy.contains("네, 신청할게요").click();

    cy.wait("@sendMatchRequest");
    cy.contains("대화 신청 완료", { timeout: 6000 }).should("be.visible");
  });

  it("renders the accepted matching card on home", () => {
    cy.visit("/home");

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("매칭 완료").should("be.visible");
    cy.contains("수민").should("be.visible");
  });
});
