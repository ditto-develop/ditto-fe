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

    cy.contains("안녕하세요, 반가워요!").click();
    cy.location("pathname", { timeout: 6000 }).should("include", "/chat/one-on-one/1");
  });

  // 로딩 문구 한 줄만 띄우면 데이터 도착 순간 레이아웃이 통째로 바뀌어 화면이 튄다.
  it("holds the layout with a skeleton while rooms load", () => {
    cy.intercept("GET", "**/api/**/chat/rooms", (req) => {
      req.on("response", (res) => res.setDelay(600));
    }).as("slowChatRooms");

    cy.visit("/chat");

    cy.get("[data-cy=chat-list-skeleton]").should("exist");
    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    cy.get("[data-cy=chat-list-skeleton]").should("not.exist");
  });

  it("splits rooms by the derived state (isEnded · expiresAt)", () => {
    cy.visit("/chat");
    cy.wait("@getChatRooms");

    // 종료 = isEnded 이거나 expiresAt이 지난 방. 픽스처의 roomId 2가 여기 해당한다.
    cy.contains("button", "종료").click();
    cy.contains("사진을 보냈어요.").should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("not.exist");

    cy.contains("button", "진행중").click();
    cy.contains("안녕하세요, 반가워요!").should("be.visible");
    cy.contains("사진을 보냈어요.").should("not.exist");
  });

  it("shows filter-specific empty states and returns to the full list", () => {
    cy.intercept("GET", "**/api/**/chat/rooms", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("emptyChatRooms");

    cy.visit("/chat");
    cy.wait("@emptyChatRooms");

    cy.contains("아직 나눈 대화가 없어요").should("be.visible");
    cy.contains("퀴즈에 참여하고 새로운 만남을 시작해 보세요!").should("be.visible");

    cy.contains("button", "진행중").click();
    cy.contains("대화방이 없어요").should("be.visible");
    cy.contains("퀴즈에 참여하고 새로운 만남을 시작해 보세요!").should("not.exist");
    cy.contains("button", "대화목록 전체보기").click();
    cy.contains("아직 나눈 대화가 없어요").should("be.visible");

    cy.contains("button", "종료").click();
    cy.contains("대화방이 없어요").should("be.visible");
    cy.contains("button", "대화목록 전체보기").click();
    cy.contains("아직 나눈 대화가 없어요").should("be.visible");
  });
});
