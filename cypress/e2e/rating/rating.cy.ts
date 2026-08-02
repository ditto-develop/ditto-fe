function mockEndedOneOnOneRoom() {
  cy.fixture("chat-room-detail.json").then((room) => {
    cy.intercept("GET", "**/api/**/chat/rooms/*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...room,
          status: "ENDED",
          canSendMessage: false,
          isEnded: true,
        },
      },
    }).as("getEndedChatRoomDetail");
  });
}

function mockGroupRoom(ended: boolean) {
  cy.fixture("group-chat-detail.json").then((room) => {
    cy.intercept("GET", "**/api/**/chat/group-rooms/*", {
      statusCode: 200,
      body: {
        success: true,
        data: { ...room, isEnded: ended },
      },
    }).as("getRatingGroupRoomDetail");
  });

  cy.fixture("group-chat-messages.json").then((data) => {
    cy.intercept("GET", "**/api/**/chat/group-rooms/*/messages*", {
      statusCode: 200,
      body: { success: true, data },
    }).as("getRatingGroupMessages");
  });

  cy.intercept("PATCH", "**/api/**/chat/group-rooms/*/read", {
    statusCode: 200,
    body: { success: true, data: null },
  }).as("markRatingGroupRead");
}

describe("rating system", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
    cy.intercept("POST", "**/api/v1/ratings", {
      statusCode: 200,
      body: {
        success: true,
        data: { ratingId: "rating-e2e", submittedAt: "2026-07-01T00:00:00.000Z" },
      },
    }).as("submitOneOnOneRating");
    cy.intercept("POST", "**/api/v1/group-ratings", {
      statusCode: 200,
      body: {
        success: true,
        data: { ratingIds: ["rating-1", "rating-2"], submittedAt: "2026-07-01T00:00:00.000Z" },
      },
    }).as("submitGroupRating");
    cy.intercept("POST", "**/api/v1/rematches/request", {
      statusCode: 200,
      body: {
        success: true,
        data: { rematchId: null, matched: false, targetUserId: "partner-1" },
      },
    }).as("requestRematch");
  });

  it("opens from an ended 1:1 chat and submits a rating", () => {
    mockEndedOneOnOneRoom();
    cy.visit("/chat/one-on-one/room-1");
    cy.wait(["@getEndedChatRoomDetail", "@getChatMessages"]);

    cy.contains("button", "평가하기").click();
    cy.location("pathname").should("include", "/chat/one-on-one/room-1/rate");
    cy.contains("민지님 평가").should("be.visible");
    cy.contains("button", "평가 제출하기").should("be.disabled");

    cy.contains("button", "채팅만 했어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("친절하고 재밌어요");
    cy.contains("9/50").should("be.visible");
    cy.contains("button", "평가 제출하기").should("be.enabled").click();

    cy.wait("@submitOneOnOneRating");
    cy.location("pathname").should("match", /^\/chat\/?$/);
  });

  it("opens from an ended group chat", () => {
    mockGroupRoom(true);
    cy.visit("/chat/group/group-room-1");
    cy.wait(["@getRatingGroupRoomDetail", "@getRatingGroupMessages"]);

    cy.contains("button", "평가하기").click();
    cy.location("pathname").should("include", "/chat/group/group-room-1/rate");
    cy.contains("그룹 멤버 평가").should("be.visible");
  });

  it("rates every group member and requests a rematch", () => {
    mockGroupRoom(false);
    cy.visit("/chat/group/group-room-1/rate");
    cy.wait("@getRatingGroupRoomDetail");

    cy.contains("그룹 멤버 평가").should("be.visible");
    cy.get('button[aria-label="1:1 재매칭 프로세스 도움말"]').click();
    cy.contains("1:1 재매칭 프로세스란?").should("be.visible");
    cy.get('button[aria-label="닫기"]').click();

    cy.contains("button", "만났어요").click();
    cy.get('button[aria-label="4점"]').click();
    cy.contains("💝 1:1로 다시 만나고 싶어요").click();
    cy.contains("button", "다음 멤버 평가하기").click();

    cy.contains("2/2").should("be.visible");
    cy.contains("button", "약속 잡았어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("즐거웠어요");
    cy.contains("button", "평가 제출하기").click();

    cy.wait(["@submitGroupRating", "@requestRematch"]);
    cy.location("pathname").should("match", /^\/chat\/?$/);
  });
});
