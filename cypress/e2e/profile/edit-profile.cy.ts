/** PATCH /api/v1/users/me/profile 는 소개/캐리커쳐/관심사만 받는다. */
type ProfilePatch = {
  introduction?: string;
  profileImageUrl?: string;
  interests?: string[];
};

let lastProfilePatch: ProfilePatch | null = null;

function mockEditProfileApi() {
  lastProfilePatch = null;

  cy.fixture("my-profile.json").then((profile) => {
    cy.intercept("GET", "**/api/v1/users/me/profile", { success: true, data: profile }).as("getMyProfile");
    cy.intercept("PATCH", "**/api/v1/users/me/profile", (req) => {
      lastProfilePatch = req.body as ProfilePatch;
      req.reply({ success: true, data: { ...profile, ...req.body } });
    }).as("patchMyProfile");
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
    cy.get("[aria-label='프로필 이미지 수정']").click();
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

    cy.then(() => {
      // 서버가 받는 값은 이 셋뿐이다. 닉네임/성별/나이/사는곳/직업은 보내지 않는다.
      expect(lastProfilePatch).to.have.keys(["introduction", "profileImageUrl", "interests"]);
      expect(lastProfilePatch?.introduction).to.equal("새로운 한 줄 소개입니다");
      expect(lastProfilePatch?.interests).to.include("music");
    });
  });

  // exhibition은 BE에 뒤늦게 추가된 code다. 칩이 없으면 저장 시 400이 났다.
  it("keeps 전시(exhibition) selectable and sends it back", () => {
    cy.visit("/profile/edit");

    cy.contains("🖼️ 전시").should("be.visible");
    cy.get("textarea").clear().type("전시 보러 다니는 걸 좋아해요");
    cy.contains("저장").click();
    cy.wait("@patchMyProfile");

    cy.then(() => {
      expect(lastProfilePatch?.interests).to.include("exhibition");
    });
  });
});
