function mockFixtureData(method: "GET" | "POST", urls: string[], fixtureName: string, alias: string) {
  cy.fixture(fixtureName).then((data: unknown) => {
    urls.forEach((url, index) => {
      cy.intercept(method, url, {
        statusCode: 200,
        body: {
          success: true,
          data,
        },
      }).as(index === 0 ? alias : `${alias}${index + 1}`);
    });
  });
}

function mockPopulatedMatches() {
  mockFixtureData("GET", ["**/api/v1/matches/1on1", "**/api/matches/1on1"], "matches-1on1-populated.json", "getPopulatedMatches");
}

function mockAcceptedStatus() {
  mockFixtureData("GET", ["**/api/v1/matching/status/**", "**/api/matching/status/**"], "matching-status-accepted.json", "getAcceptedMatchingStatus");
}

describe("thursday matching day", () => {
  beforeEach(() => {
    cy.mockApi();
    cy.login();
    mockPopulatedMatches();
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
    mockAcceptedStatus();

    cy.visit("/home");

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("매칭 완료").should("be.visible");
    cy.contains("수민").should("be.visible");
  });
});
