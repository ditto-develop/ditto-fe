type NotificationSettings = {
  matching: boolean;
  chat: boolean;
  marketing: boolean;
};

/** GET /api/v1/users/me/blocks — id는 차단된 회원 ID(int64), blockedAt은 `yyyy-MM-dd HH:mm:ss`. */
type BlockedUser = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  blockedAt: string;
};

const currentUser = {
  email: "test@email.com",
  birthDate: "1995-03-15",
  name: "홍길동",
  phoneNumber: "010-1234-1234",
  gender: "MALE",
};

const myProfile = {
  userId: 1,
  nickname: "개굴개굴렌",
  gender: "MALE",
  age: 27,
  introduction: "주말마다 한강 산책하는 걸 좋아해요!",
  profileImageUrl: "/assets/avatar/m3.png",
  location: "seoul",
  occupation: "it-tech",
  interests: ["workout", "movie-drama", "exhibition"],
};

const initialNotificationSettings: NotificationSettings = {
  matching: true,
  chat: false,
  marketing: false,
};

const initialBlockedUsers: BlockedUser[] = [
  {
    id: 42,
    nickname: "댕이나나",
    profileImageUrl: "/assets/avatar/f1.png",
    blockedAt: "2026-01-12 09:00:00",
  },
  {
    id: 43,
    nickname: "safdflnk",
    profileImageUrl: "/assets/avatar/m1.png",
    blockedAt: "2025-10-12 09:00:00",
  },
];

function mockSettingsApi() {
  let notificationSettings = { ...initialNotificationSettings };
  let blockedUsers = [...initialBlockedUsers];

  cy.intercept("GET", "**/api/**/users/me", {
    success: true,
    data: currentUser,
  }).as("getCurrentUserForSettings");

  cy.intercept("GET", "**/api/**/users/me/profile", {
    success: true,
    data: myProfile,
  }).as("getMyProfileForSettings");

  cy.intercept("GET", "**/api/**/users/me/notification-settings", {
    success: true,
    data: notificationSettings,
  }).as("getNotificationSettings");

  cy.intercept("PATCH", "**/api/**/users/me/notification-settings", (req) => {
    notificationSettings = { ...notificationSettings, ...req.body };
    req.reply({ success: true, data: notificationSettings });
  }).as("patchNotificationSettings");

  cy.intercept("GET", "**/api/**/users/me/blocks", {
    success: true,
    data: blockedUsers,
  }).as("getBlockedUsers");

  cy.intercept("DELETE", "**/api/**/users/me/blocks/*", (req) => {
    const id = req.url.split("/").pop();
    blockedUsers = blockedUsers.filter((user) => String(user.id) !== id);
    req.reply({ success: true, data: null });
  }).as("deleteBlockedUser");

  cy.intercept("POST", "**/api/**/users/*/leave", {
    success: true,
    data: { id: "user-e1e" },
  }).as("leaveUser");

  cy.intercept("POST", "**/api/**/users/auth/logout", {
    success: true,
    data: null,
  }).as("logout");
}

function assertNoPageHorizontalScroll() {
  cy.document().then((document) => {
    expect(document.documentElement.scrollWidth).to.be.lte(document.documentElement.clientWidth);
    expect(document.body.scrollWidth).to.be.lte(document.body.clientWidth);
  });
}

describe("settings", () => {
  beforeEach(() => {
    cy.mockApi();
    mockSettingsApi();
    cy.login();
  });

  it("shows account information and updates notification switches", () => {
    cy.visit("/settings");

    cy.contains("설정").should("be.visible");
    assertNoPageHorizontalScroll();
    cy.contains("test@email.com").should("be.visible");
    cy.contains("010-****-1234").should("be.visible");
    cy.get('[role="switch"][aria-label="매칭 알림"]').should("have.attr", "aria-checked", "true");
    cy.get('[role="switch"][aria-label="채팅 알림"]').click();
    cy.wait("@patchNotificationSettings");
    cy.get('[role="switch"][aria-label="채팅 알림"]').should("have.attr", "aria-checked", "true");
  });

  it("unblocks a blocked user", () => {
    cy.visit("/settings");
    cy.contains("차단 목록").click();
    cy.location("pathname").should("include", "/settings/blocks");
    assertNoPageHorizontalScroll();
    cy.contains("2명 차단 중").should("be.visible");
    cy.contains("댕이나나").should("be.visible");

    cy.contains("댕이나나")
      .parents("li")
      .within(() => {
        cy.contains("차단 해제").click();
      });
    cy.contains("차단을 해제할까요?").should("be.visible");
    cy.contains("네, 해제할게요").click();
    cy.wait("@deleteBlockedUser");
    cy.contains("1명 차단 중").should("be.visible");
    cy.contains("댕이나나").should("not.exist");
  });

  it("renders policy documents", () => {
    cy.visit("/settings");

    cy.contains("서비스 이용약관").click();
    cy.location("pathname").should("include", "/settings/terms");
    assertNoPageHorizontalScroll();
    cy.contains("디토 이용 약관").should("be.visible");
    cy.contains("제1조 (목적)").should("be.visible");

    cy.visit("/settings/privacy");
    assertNoPageHorizontalScroll();
    cy.contains("개인정보 처리방침").should("be.visible");
    cy.contains("개인정보 처리의 위탁").should("be.visible");

    cy.visit("/settings/location-terms");
    assertNoPageHorizontalScroll();
    cy.contains("위치기반 서비스 이용약관").should("be.visible");
    cy.contains("제1조 (목적)").should("be.visible");
  });

  it("logs out after confirmation", () => {
    cy.visit("/settings");
    cy.contains("로그아웃").click();
    cy.contains("정말 로그아웃할까요?").should("be.visible");
    cy.contains("확인").click();
    cy.wait("@logout");
    cy.location("pathname").should("eq", "/");
  });

  it("withdraws after selecting a reason", () => {
    cy.visit("/settings/withdraw");

    cy.contains("프로필을 불러오는 중").should("not.exist");
    cy.contains("회원 님").should("not.exist");
    cy.contains("개굴개굴렌 님, 잠깐만요!").should("be.visible");
    assertNoPageHorizontalScroll();
    cy.contains("button", "확인").click();
    cy.contains("개굴개굴렌 님, 정말 떠나실 건가요?").should("be.visible");
    assertNoPageHorizontalScroll();
    cy.contains("사유를 선택해 주세요").click();
    cy.contains("기타").click();
    cy.contains("더 나은 ditto").should("be.visible");
    cy.contains("button", "탈퇴하기").click();
    cy.wait("@leaveUser");
    cy.contains("탈퇴 완료").should("be.visible");
    cy.contains("button", "확인").click();
    cy.location("pathname").should("eq", "/");
  });

  // 6011: 진행 중인 매칭/채팅이 남아 있으면 서버가 탈퇴를 거절한다(HTTP 200 + success:false).
  it("explains why withdrawal is blocked (6011)", () => {
    cy.intercept("POST", "**/api/**/users/*/leave", {
      statusCode: 200,
      body: {
        success: false,
        data: null,
        error: { statusCode: 409, code: "6011", message: "진행 중인 매칭이 있습니다." },
      },
    }).as("leaveBlocked");

    cy.visit("/settings/withdraw");
    cy.contains("button", "확인").click();
    cy.contains("사유를 선택해 주세요").click();
    cy.contains("기타").click();
    cy.contains("button", "탈퇴하기").click();
    cy.wait("@leaveBlocked");

    cy.contains("탈퇴 실패").should("be.visible");
    cy.contains("진행 중인 매칭이나 채팅이 있어 탈퇴할 수 없어요.").should("be.visible");
    cy.contains("탈퇴 완료").should("not.exist");
  });
});
