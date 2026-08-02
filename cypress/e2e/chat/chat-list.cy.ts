describe("chat list", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("lists chat rooms with the counterpart profile and opens a 1:1 room", () => {
    cy.visit("/chat");

    cy.wait("@getChatRooms");
    cy.contains("대화방", { timeout: 6000 }).should("be.visible");

    // 방 목록 응답에는 counterpartMemberIds만 있어 닉네임은 프로필 조회로 채운다.
    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("be.visible");

    // IMAGE 마지막 메시지는 objectKey 대신 안내 문구로 보여준다.
    cy.contains("사진을 보냈어요.").should("be.visible");

    cy.contains("안녕하세요, 반가워요!").click();
    cy.location("pathname", { timeout: 6000 }).should("include", "/chat/one-on-one/1");
  });

  it("shows no rooms under the 종료 filter (live contract has no room status)", () => {
    cy.visit("/chat");
    cy.wait("@getChatRooms");

    cy.contains("button", "종료").click();
    cy.contains("대화방이 없어요.").should("be.visible");

    cy.contains("button", "진행중").click();
    cy.contains("안녕하세요, 반가워요!").should("be.visible");
  });
});
