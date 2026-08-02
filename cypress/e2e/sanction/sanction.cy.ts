const suspension = {
  level: "SUSPENSION",
  levelDescription: "기간 이용 정지",
  reason: "inappropriate-behavior",
  reasonDescription: "부적절한 행동 (성희롱·폭언·협박 등)",
  startsAt: "2026-07-19 01:00:54",
  endsAt: "2026-08-02 01:00:54",
};

/** 제재 게이트는 실제 HTTP 403 + code 6006/6007 로 내려온다. */
function forbidden(code: string, message: string) {
  return {
    statusCode: 403,
    body: { success: false, data: null, error: { statusCode: 403, code, message } },
  };
}

describe("sanction", () => {
  beforeEach(() => {
    cy.mockApi();
  });

  it("renders the suspension notice from the OAuth callback without a token", () => {
    // 제재 회원은 accessToken이 발급되지 않는다. 토큰 없이 콜백 쿼리만으로 렌더돼야 한다.
    cy.visit(
      "/auth/callback?sanctioned=true&sanctionCode=MEMBER_SUSPENDED&suspendedUntil=2026-08-02T01:00:54",
    );

    cy.location("pathname", { timeout: 8000 }).should("include", "/sanction");
    cy.contains("이용이 정지됐어요").should("be.visible");
    cy.contains("2026.08.02").should("be.visible");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("accessToken")).to.equal(null);
    });
  });

  it("renders the permanent ban notice from the OAuth callback", () => {
    cy.visit("/auth/callback?sanctioned=true&sanctionCode=MEMBER_BANNED");

    cy.location("pathname", { timeout: 8000 }).should("include", "/sanction");
    cy.contains("영구 차단됐어요").should("be.visible");
  });

  it("shows sanction detail from /users/me/sanction for a logged-in user", () => {
    cy.login();
    cy.intercept("GET", "**/api/**/users/me/sanction", {
      success: true,
      data: { sanction: suspension },
    }).as("getMySanction");

    cy.visit("/sanction");
    cy.wait("@getMySanction");

    cy.contains("이용이 정지됐어요").should("be.visible");
    cy.contains("부적절한 행동 (성희롱·폭언·협박 등)").should("be.visible");
    cy.contains("2026.07.19").should("be.visible");
  });

  it("redirects to the sanction screen when a protected API returns 403 (6006)", () => {
    cy.login();
    cy.intercept("GET", "**/api/**/users/me/profile", forbidden("6006", "이용이 정지된 계정입니다.")).as(
      "blockedProfile",
    );
    cy.intercept("GET", "**/api/**/users/me/sanction", {
      success: true,
      data: { sanction: suspension },
    }).as("getMySanction");

    cy.visit("/profile");

    cy.location("pathname", { timeout: 8000 }).should("include", "/sanction");
    cy.contains("이용이 정지됐어요").should("be.visible");
  });

  it("shows an inline notice when the quiz is blocked by a warning (6008)", () => {
    cy.clockPeriod("QUIZ");
    cy.login();
    cy.intercept(
      "POST",
      "**/api/**/quiz-progress/answers",
      // 6008은 HTTP 200 + success:false 로 내려오며, 세션 전체를 막지 않는다.
      {
        statusCode: 200,
        body: {
          success: false,
          data: null,
          error: {
            statusCode: 403,
            code: "6008",
            message: "제재로 인해 이번 주 퀴즈에 참여할 수 없습니다.",
          },
        },
      },
    ).as("blockedAnswer");

    cy.visit("/quiz/current");
    cy.contains("처음 만난 사람과 가장 편한 대화 주제는?", { timeout: 8000 }).should("be.visible");
    cy.contains("가볍게 취미 이야기").click();

    cy.wait("@blockedAnswer");
    cy.contains("제재로 인해 이번 주 퀴즈에 참여할 수 없습니다.").should("be.visible");
    // 퀴즈 화면 자체는 계속 사용할 수 있어야 한다(제재 화면으로 튕기지 않음).
    cy.location("pathname").should("include", "/quiz");
  });
});
