// 그룹 방은 별도 엔드포인트가 없다. 1:1·재매칭과 같은 `/api/v1/chat/rooms` 계약을 쓰고
// `sourceType: "GROUP"`으로만 구분된다(BE #119 그룹 방 자동 생성).
// 따라서 cy.mockApi()의 chat-rooms 픽스처(roomId 3 = GROUP)만으로 커버된다.
describe("group chat room", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("opens the group room from the chat list", () => {
    cy.visit("/chat");
    cy.wait("@getChatRooms");

    cy.contains("다들 안녕하세요!", { timeout: 8000 }).click();
    cy.location("pathname", { timeout: 6000 }).should("include", "/chat/group/3");
  });

  it("loads members and messages from the shared room contract", () => {
    cy.visit("/chat/group/3");

    cy.wait("@getChatRooms");
    cy.wait("@getChatMessages");

    // 헤더 타이틀은 counterpartMemberIds로 조회한 참여자 닉네임이다.
    cy.contains("수민", { timeout: 8000 }).should("be.visible");

    // 메시지는 1:1과 같은 커서 페이징 응답을 그대로 쓴다.
    cy.contains("다들 안녕하세요!").should("be.visible");
    cy.contains("반가워요! 이번 주말 시간 어떠세요?").should("be.visible");
  });

  it("hides the vote entry point while the BE contract is missing", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getChatRooms");

    cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("be.visible");
    cy.contains("투표 만들기").should("not.exist");
  });
});
