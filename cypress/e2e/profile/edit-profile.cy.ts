/**
 * PATCH /api/v1/users/me/profile — 캐리커쳐·관심사·사는 곳·직업, 바뀐 경우에만 닉네임.
 * 성별·나이는 읽기 전용이다(2026-09-27).
 * (한 줄 소개는 소개 노트 Q10 과 같은 값이라 이 화면에 두지 않는다 — Figma 6.1.1.)
 */
type ProfilePatch = {
  introduction?: string;
  profileImageUrl?: string;
  interests?: string[];
  nickname?: string;
  location?: string;
  occupation?: string;
};

function selectFromBottomSheet(labelText: string, optionText: string) {
  cy.get(`button[aria-label="${labelText}"]`).click();
  cy.contains("li", optionText, { timeout: 4000 }).click();
}

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

  it("edits profile image and interests", () => {
    cy.visit("/profile/edit");
    cy.wait("@getMyProfile");

    cy.contains("프로필 수정").should("be.visible");
    cy.contains("닉네임").should("be.visible");
    cy.contains("성별").should("be.visible");
    cy.contains("나이").should("be.visible");
    cy.contains("관심사").should("be.visible");
    cy.contains("사는 곳").should("be.visible");
    cy.contains("직업").should("be.visible");
    // 한 줄 소개는 이 화면에 없다(Figma 6.1.1). 소개 노트 수정에서 Q10 으로 고친다.
    cy.contains("한 줄 소개").should("not.exist");
    cy.get("textarea").should("not.exist");

    cy.get("[aria-label='프로필 이미지 수정']").click();
    cy.contains("캐리커쳐 선택하기").should("be.visible");
    // 캐리커쳐는 계정 성별(픽스처: MALE)에 고정된다 — 남자/여자 탭이 없고 남자 캐리커쳐만 보인다.
    cy.contains("button", "여자").should("not.exist");
    cy.get('img[alt^="f"]').should("not.exist");
    cy.get('img[alt="m5"]').click();
    cy.get("button").contains("골랐어요").click();

    cy.contains("🎵 음악").click();
    cy.contains("저장").click();

    cy.wait("@patchMyProfile");
    cy.location("pathname").should("eq", "/profile/");

    cy.then(() => {
      // 닉네임은 안 바꿨으니 보내지 않는다(서버가 변경 횟수로 셀 수 있다). 성별/나이/한 줄 소개도 없다.
      expect(lastProfilePatch).to.have.keys(["profileImageUrl", "interests", "location", "occupation"]);
      expect(lastProfilePatch?.location).to.equal("seoul");
      expect(lastProfilePatch?.occupation).to.equal("it-tech");
      expect(lastProfilePatch?.profileImageUrl).to.equal("/assets/avatar/m5.png");
      expect(lastProfilePatch?.interests).to.include("music");
    });
  });

  // exhibition은 BE에 뒤늦게 추가된 code다. 칩이 없으면 저장 시 400이 났다.
  it("keeps 전시(exhibition) selectable and sends it back", () => {
    cy.visit("/profile/edit");
    /*
     * 프로필이 도착할 때까지 기다린다. 관심사 칩은 응답 전에 이미 렌더되는데,
     * 그때 고른 값은 뒤늦게 도착한 응답의 setInterests 가 덮어쓴다. 그러면 관심사가
     * 원본과 같아져 isDirty 가 false 가 되고 저장 버튼이 비활성으로 남는다
     * (EditProfileContainer 의 isDirty 는 아바타 URL 이 일치해 관심사 차이 하나에만 걸린다).
     * 기다리지 않으면 이 스펙은 머신·네트워크 속도에 따라 통과했다 실패했다 한다.
     */
    cy.wait("@getMyProfile");

    cy.contains("🖼️ 전시").should("be.visible");
    // 저장은 바뀐 것이 있어야 활성화된다 — 관심사를 하나 더 고른다.
    cy.contains("🎵 음악").click();
    cy.contains("저장").click();
    cy.wait("@patchMyProfile");

    cy.then(() => {
      expect(lastProfilePatch?.interests).to.include("exhibition");
    });
  });

  it("edits nickname, location and occupation", () => {
    cy.visit("/profile/edit");
    cy.wait("@getMyProfile");

    cy.contains("닉네임은 14일 동안 최대 2번 바꿀 수 있어요. 대화 중에는 바꿀 수 없어요.").should("be.visible");
    cy.get('input[placeholder="사용할 닉네임을 입력해주세요"]').clear().type("새닉네임");
    selectFromBottomSheet("사는 곳", "부산");
    selectFromBottomSheet("직업", "디자인");
    cy.contains("저장").click();

    cy.wait("@checkNickname");
    cy.wait("@patchMyProfile");
    cy.location("pathname").should("eq", "/profile/");

    cy.then(() => {
      expect(lastProfilePatch?.nickname).to.equal("새닉네임");
      expect(lastProfilePatch?.location).to.equal("busan");
      expect(lastProfilePatch?.occupation).to.equal("design");
    });
  });

  it("keeps the screen and shows an inline error when the nickname is taken", () => {
    cy.intercept("GET", "**/api/v1/users/nickname/*/availability", {
      success: true,
      data: { available: false },
    }).as("nicknameTaken");

    cy.visit("/profile/edit");
    cy.wait("@getMyProfile");

    cy.get('input[placeholder="사용할 닉네임을 입력해주세요"]').clear().type("이미있음");
    cy.contains("저장").click();
    cy.wait("@nicknameTaken");

    cy.contains("이미 사용 중인 닉네임이에요.").should("be.visible");
    cy.location("pathname").should("include", "/profile/edit");
    cy.then(() => {
      expect(lastProfilePatch).to.equal(null);
    });
  });
});
