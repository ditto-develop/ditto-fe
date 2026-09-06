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

  // 투표 자체의 플로우는 group-vote.cy.ts가 다룬다.
  it("surfaces the meeting vote banner in the room", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getChatRooms");
    cy.wait("@getRoomVotes");

    cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("be.visible");
    cy.contains("만남 투표 진행 중").should("be.visible");
  });

  // 멤버별 답변 일치 배지는 GET /api/v1/users/{id}/answers 의 일치 개수로 그린다.
  // 서버는 상대의 선택지 원문도, 등급 문구도 주지 않는다 — 문구는 FE(getMatchBadgeInfo)가 만든다.
  describe("member list — 답변 일치 배지", () => {
    function openMemberList() {
      cy.visit("/chat/group/3");
      cy.wait("@getChatRooms");
      cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("be.visible");

      cy.get('img[alt="더보기"]').click();
      cy.contains("멤버 목록").click();
      cy.contains("멤버 전체보기", { timeout: 6000 }).should("be.visible");
    }

    it("일치 개수로 등급 배지와 문구를 그린다", () => {
      openMemberList();
      cy.wait("@getUserAnswerMatch");

      cy.contains("😊 대부분 비슷하게 생각해요").should("be.visible");
      cy.contains("12개중 9개 일치").should("be.visible");
    });

    // 함께 완주한 퀴즈셋이 없으면 quizSetId: null 로 온다(403이 아니다).
    it("함께 완주한 퀴즈셋이 없으면 배지를 숨긴다", () => {
      cy.intercept("GET", "**/api/v1/users/*/answers", {
        success: true,
        data: { quizSetId: null, matchedCount: 0, totalCount: 0, matchRate: 0.0 },
      }).as("getUserAnswerMatchEmpty");

      openMemberList();
      cy.wait("@getUserAnswerMatchEmpty");

      cy.contains("개 일치").should("not.exist");
    });
  });
});
