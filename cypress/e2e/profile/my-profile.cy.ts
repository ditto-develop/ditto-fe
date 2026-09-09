function mockMyProfileApi() {
  cy.fixture("my-profile.json").then((profile) => {
    cy.intercept("GET", "**/api/v1/users/me/profile", { success: true, data: profile }).as("getMyProfile");
  });
  cy.fixture("my-stats.json").then((stats) => {
    cy.intercept("GET", "**/api/v1/users/me/stats", { success: true, data: stats }).as("getMyStats");
  });
  cy.fixture("my-ratings.json").then((ratings) => {
    cy.intercept("GET", "**/api/v1/users/me/ratings", { success: true, data: ratings }).as("getMyRatings");
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

  // 로딩 문구 한 줄만 띄우면 데이터 도착 순간 레이아웃이 통째로 바뀌어 화면이 튄다.
  it("holds the layout with a skeleton while the profile loads", () => {
    cy.intercept("GET", "**/api/v1/users/me/profile", (req) => {
      req.on("response", (res) => res.setDelay(600));
    }).as("slowMyProfile");

    cy.visit("/profile");

    cy.get("[data-cy=my-profile-skeleton]").should("exist");
    cy.contains("개굴개굴렌", { timeout: 8000 }).should("be.visible");
    cy.get("[data-cy=my-profile-skeleton]").should("not.exist");
  });

  // 비공개 규칙: totalCount < publicThreshold면 평균/노쇼/코멘트가 0·빈 배열로 내려온다.
  it("hides ratings until the public threshold is reached", () => {
    cy.intercept("GET", "**/api/v1/users/me/ratings", {
      success: true,
      data: {
        averageScore: 0,
        totalCount: 2,
        publicThreshold: 3,
        noShowCount: 0,
        ratings: [],
      },
    }).as("getMyRatingsPrivate");

    cy.visit("/profile");
    cy.wait("@getMyRatingsPrivate");

    cy.contains("평가가 충분하지 않아요").should("be.visible");
    cy.contains("대화가 편하고 좋았어요").should("not.exist");
  });
});
