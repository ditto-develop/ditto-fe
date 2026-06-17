describe("1:1 chat room", () => {
  beforeEach(() => {
    // 방 만료 판정(expiresAt < now)을 막기 위해 Date를 CHATTING 시점으로 고정.
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("loads the room, shows existing messages, and sends a new message", () => {
    cy.visit("/chat/one-on-one/room-1");

    cy.wait(["@getChatRoomDetail", "@getChatMessages"]);

    // 헤더의 상대 닉네임 + 기존 메시지
    cy.contains("민지", { timeout: 6000 }).should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("be.visible");

    // 메시지 전송 (Enter 전송) — 서버 응답 fixture 내용이 말풍선으로 추가된다.
    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').type("저도 반가워요!{enter}");

    cy.wait("@sendChatMessage");
    cy.contains("저도 반가워요!").should("be.visible");
  });
});
