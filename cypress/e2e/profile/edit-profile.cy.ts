function mockEditProfileApi() {
  cy.fixture("my-profile.json").then((profile) => {
    cy.intercept("GET", "**/api/users/me/profile", { success: true, data: profile }).as("getMyProfile");
    cy.intercept("GET", "**/api/v1/users/me/profile", { success: true, data: profile }).as("getMyProfileV1");
    cy.intercept("PATCH", "**/api/users/me/profile", (req) => {
      req.reply({ success: true, data: { ...profile, ...req.body } });
    }).as("patchMyProfile");
    cy.intercept("PATCH", "**/api/v1/users/me/profile", (req) => {
      req.reply({ success: true, data: { ...profile, ...req.body } });
    }).as("patchMyProfileV1");
  });
}

describe("edit my profile", () => {
  beforeEach(() => {
    cy.mockApi();
    mockEditProfileApi();
    cy.login();
  });

  it("edits profile image, introduction, and interests", () => {
    cy.visit("/profile/edit");

    cy.contains("프로필 수정").should("be.visible");
    cy.contains("닉네임").should("be.visible");
    cy.contains("성별").should("be.visible");
    cy.contains("나이").should("be.visible");
    cy.contains("관심사").should("be.visible");
    cy.contains("사는 곳").should("be.visible");
    cy.contains("직업").should("be.visible");
    cy.get("button[aria-label='프로필 이미지 수정']").click();
    cy.contains("캐리커처 선택하기").should("be.visible");
    cy.get("button").contains("골랐어요").click();

    cy.get("textarea")
      .should("have.value", "주말마다 한강 산책하는 걸 좋아해요!")
      .clear()
      .type("새로운 한 줄 소개입니다");
    cy.contains("🎵 음악").click();
    cy.contains("저장").click();

    cy.wait("@patchMyProfile");
    cy.location("pathname").should("eq", "/profile/");
  });
});
