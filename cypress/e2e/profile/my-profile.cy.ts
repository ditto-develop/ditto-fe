function mockMyProfileApi() {
  cy.fixture("my-profile.json").then((profile) => {
    cy.intercept("GET", "**/api/users/me/profile", { success: true, data: profile }).as("getMyProfile");
    cy.intercept("GET", "**/api/v1/users/me/profile", { success: true, data: profile }).as("getMyProfileV1");
  });
  cy.fixture("my-stats.json").then((stats) => {
    cy.intercept("GET", "**/api/users/me/stats", { success: true, data: stats }).as("getMyStats");
    cy.intercept("GET", "**/api/v1/users/me/stats", { success: true, data: stats }).as("getMyStatsV1");
  });
  cy.fixture("my-ratings.json").then((ratings) => {
    cy.intercept("GET", "**/api/users/me/ratings", { success: true, data: ratings }).as("getMyRatings");
    cy.intercept("GET", "**/api/v1/users/me/ratings", { success: true, data: ratings }).as("getMyRatingsV1");
  });
}

describe("my profile", () => {
  beforeEach(() => {
    cy.mockApi();
    mockMyProfileApi();
    cy.login();
  });

  it("shows my profile summary and routes to edit screens", () => {
    cy.visit("/profile");

    cy.contains("내 프로필").should("be.visible");
    cy.contains("개굴개굴렌").should("be.visible");
    cy.contains("25~29세 · 남성 · 서울").should("be.visible");
    cy.contains("주말마다 한강 산책하는 걸 좋아해요!").should("be.visible");
    cy.contains("참여 주차").should("be.visible");
    cy.contains("매칭 성사").should("be.visible");
    cy.contains("만남 횟수").should("be.visible");
    cy.contains("4.7").should("be.visible");
    cy.contains("(30)").should("be.visible");
    cy.contains("대화가 편하고 좋았어요").should("be.visible");
    cy.contains("+27").should("be.visible");

    cy.contains("프로필 수정").click();
    cy.location("pathname").should("eq", "/profile/edit/");
    cy.go("back");
    cy.contains("소개 노트 수정").click();
    cy.location("pathname").should("eq", "/profile/intro-note/");
  });
});
