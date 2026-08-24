/**
 * 평가(member-reviews) 흐름.
 *
 * 평가 화면은 GET /api/v1/member-reviews에서 chatRoomId로 평가를 찾고,
 * 대상 한 명씩 PUT .../targets/{memberId}로 확정한다.
 */
describe("rating system", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("채팅방 목록에서 평가가 열린 방에만 진입점을 띄운다", () => {
    cy.visit("/chat");
    cy.wait(["@getChatRooms", "@getMemberReviews"]);

    // 목업 평가 2건(chatRoomId 1·2)이 곧 채팅방 2개와 1:1 대응한다.
    cy.contains("button", "평가하기").should("have.length.at.least", 1);
    cy.get("button").contains("평가하기").first().click();
    cy.location("pathname").should("include", "/rate");
  });

  it("1:1 평가를 제출한다", () => {
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.contains("수민님 평가", { timeout: 8000 }).should("be.visible");
    cy.contains("button", "평가 제출하기").should("be.disabled");

    cy.contains("button", "채팅만 했어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("친절하고 재밌어요");
    cy.contains("9/50").should("be.visible");
    cy.contains("button", "평가 제출하기").should("be.enabled").click();

    // 1:1은 wantsOneToOneRematch를 보내면 8002라 바디에 실리면 안 된다.
    cy.wait("@submitMemberReview").then(({ request }) => {
      expect(request.body).to.deep.equal({
        meetingStatus: "CHAT_ONLY",
        rating: 5,
        comment: "친절하고 재밌어요",
      });
      expect(request.url).to.include("/member-reviews/11/targets/2");
    });

    cy.location("pathname").should("match", /^\/home\/?$/);
  });

  it("1:1 평가를 건너뛸 때 확인을 요청한다", () => {
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.get('img[alt="close"]').click();
    cy.contains("평가를 건너뛸까요?").should("be.visible");
    cy.contains("button", "취소").click();
    cy.location("pathname").should("include", "/rate");

    cy.get('img[alt="close"]').click();
    cy.contains("button", "건너뛰기").click();
    cy.location("pathname").should("match", /^\/chat\/?$/);
  });

  it("1:1 평가에서 신고를 선택하면 제출 후 신고 화면으로 이동한다", () => {
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.contains("button", "채팅만 했어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.contains("사용자 신고하기").click();
    cy.contains("button", "평가 제출하기").click();

    cy.wait("@submitMemberReview");
    cy.location("pathname").should("match", /^\/report\/?$/);
    cy.location("search").should("eq", "?userId=2&source=chat-room");
  });

  it("종료된 그룹 채팅방에서 평가 화면으로 들어간다", () => {
    // 그룹 방도 /chat/rooms 계약을 쓴다. 종료 상태만 바꿔 끼운다.
    cy.fixture("chat-rooms.json").then((rooms: Record<string, unknown>[]) => {
      cy.intercept("GET", "**/api/**/chat/rooms", {
        statusCode: 200,
        body: {
          success: true,
          data: rooms.map((room) =>
            room.roomId === 3
              ? { ...room, isEnded: true, endedAt: "2026-06-06 09:00:00", endedReason: "EXPIRED" }
              : room,
          ),
        },
      }).as("getEndedGroupRoom");
    });

    cy.visit("/chat/group/3");
    cy.wait("@getEndedGroupRoom");

    cy.contains("button", "평가하기", { timeout: 8000 }).click();
    cy.location("pathname").should("include", "/chat/group/3/rate");
  });

  it("그룹 멤버를 한 명씩 확정하고 재매칭 성사를 알린다", () => {
    cy.visit("/chat/group/2/rate");
    cy.wait("@getMemberReviews");

    cy.contains("그룹 멤버 평가").should("be.visible");
    cy.contains("민지").should("be.visible");

    cy.get('button[aria-label="1:1 재매칭 프로세스 도움말"]').click();
    cy.contains("1:1 재매칭 프로세스란?").should("be.visible");
    cy.get('button[aria-label="닫기"]').click();

    // 1번째 대상 — 재매칭 의사 true
    cy.contains("button", "만났어요").click();
    cy.get('button[aria-label="4점"]').click();
    cy.contains("💝 1:1로 다시 만나고 싶어요").click();
    cy.contains("button", "다음 멤버 평가하기").click();

    // 그룹은 wantsOneToOneRematch가 필수다.
    cy.wait("@submitMemberReview").then(({ request }) => {
      expect(request.body).to.deep.equal({
        meetingStatus: "MET",
        rating: 4,
        comment: null,
        wantsOneToOneRematch: true,
      });
      expect(request.url).to.include("/member-reviews/12/targets/3");
    });

    // 성사 축하는 한 번만 뜬다.
    cy.contains("1:1 재매칭 성사!").should("be.visible");
    cy.contains("button", "확인").click();

    // 2번째 대상 — 폼이 초기화되고 다음 멤버로 넘어간다.
    cy.contains("수현").should("be.visible");
    cy.contains("2/2").should("be.visible");
    cy.contains("button", "평가 제출하기").should("be.disabled");

    cy.contains("button", "약속 잡았어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("즐거웠어요");
    cy.contains("button", "평가 제출하기").click();

    cy.wait("@submitMemberReview").then(({ request }) => {
      expect(request.body).to.deep.equal({
        meetingStatus: "APPOINTMENT_MADE",
        rating: 5,
        comment: "즐거웠어요",
        wantsOneToOneRematch: false,
      });
      expect(request.url).to.include("/member-reviews/12/targets/4");
    });

    cy.location("pathname").should("match", /^\/home\/?$/);
  });

  it("이미 확정된 평가를 다시 내면 수정 불가 안내를 띄운다", () => {
    cy.intercept("PUT", "**/api/**/member-reviews/*/targets/*", {
      statusCode: 200,
      body: {
        success: false,
        data: null,
        error: { statusCode: 409, code: "8005", message: "이미 답변한 대상입니다." },
      },
    }).as("submitAlreadyAnswered");

    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.contains("button", "채팅만 했어요").click();
    cy.get('button[aria-label="3점"]').click();
    cy.contains("button", "평가 제출하기").click();

    cy.wait("@submitAlreadyAnswered");
    cy.contains("이미 제출한 평가는 수정할 수 없습니다.").should("be.visible");
    cy.location("pathname").should("include", "/rate");
  });
});
