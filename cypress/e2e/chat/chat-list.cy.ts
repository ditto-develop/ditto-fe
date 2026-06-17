describe("chat list", () => {
  beforeEach(() => {
    // 채팅은 금~일(CHATTING) 기간 시나리오 — 방 만료 판정(expiresAt < now)을
    // 결정적으로 막기 위해 Date를 CHATTING 시점으로 고정한다.
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("lists chat rooms and opens a 1:1 room", () => {
    cy.visit("/chat");

    cy.wait("@getChatRooms");
    cy.contains("대화방", { timeout: 6000 }).should("be.visible");
    cy.contains("민지").should("be.visible");

    cy.contains("민지").click();
    cy.location("pathname", { timeout: 6000 }).should("include", "/chat/one-on-one/room-1");
  });
});
