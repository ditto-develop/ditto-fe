// 그룹 채팅은 `/chat/group-rooms/*` 별도 엔드포인트를 쓰므로(mockApi 는 1:1 `/chat/rooms/*` 만
// 커버) settings 스펙과 동일하게 스펙 내부에서 그룹 전용 intercept 를 등록한다.
function mockGroupChatApi() {
  cy.fixture("group-chat-detail.json").then((data) => {
    cy.intercept("GET", "**/api/**/chat/group-rooms/*", {
      statusCode: 200,
      body: { success: true, data },
    }).as("getGroupRoomDetail");
  });

  cy.fixture("group-chat-messages.json").then((data) => {
    cy.intercept("GET", "**/api/**/chat/group-rooms/*/messages*", {
      statusCode: 200,
      body: { success: true, data },
    }).as("getGroupMessages");
  });

  cy.fixture("group-chat-message-sent.json").then((data) => {
    cy.intercept("POST", "**/api/**/chat/group-rooms/*/messages", {
      statusCode: 200,
      body: { success: true, data },
    }).as("sendGroupMessage");
  });

  cy.intercept("PATCH", "**/api/**/chat/group-rooms/*/read", {
    statusCode: 200,
    body: { success: true, data: null },
  }).as("markGroupAsRead");
}

describe("group chat room", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    mockGroupChatApi();
    cy.login();
  });

  it("loads the group room, shows members and messages, and sends a message", () => {
    cy.visit("/chat/group/group-room-1");

    cy.wait(["@getGroupRoomDetail", "@getGroupMessages"]);

    // 헤더 타이틀 = 멤버 닉네임 join + 기존 그룹 메시지
    cy.contains("민지", { timeout: 6000 }).should("be.visible");
    cy.contains("다들 안녕하세요!").should("be.visible");

    // 메시지 전송 — 서버 응답 fixture 내용이 말풍선으로 추가된다.
    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').type("반가워요 여러분!{enter}");

    cy.wait("@sendGroupMessage");
    cy.contains("반가워요 여러분!").should("be.visible");
  });
});
