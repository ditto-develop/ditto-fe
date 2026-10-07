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
    cy.contains("button", "평가 제출하기").should("have.attr", "aria-disabled", "true");

    cy.contains("button", "채팅만 했어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("친절하고 재밌어요");
    cy.contains("9/50").should("be.visible");
    cy.contains("button", "평가 제출하기").should("not.exist");
    cy.get('textarea[aria-label="한줄 코멘트"]').blur();
    cy.contains("button", "평가 제출하기").should("have.attr", "aria-disabled", "false").click();

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

  // 필수 항목이 비면 CTA는 비활성 모양이지만, 눌러서 무엇이 빠졌는지 볼 수 있다.
  // 토스트는 떠 있는 동안 새 호출을 무시하므로 경우마다 새로 진입한다.
  it("필수 항목을 모두 비운 채 누르면 둘 다 필수라고 알려준다", () => {
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.contains("button", "평가 제출하기", { timeout: 8000 }).click();
    cy.contains("만남 성사 여부와 별점은 필수로 선택해야 해요.").should("be.visible");
    cy.get("@submitMemberReview.all").should("have.length", 0);
  });

  it("만남 성사 여부만 비운 채 누르면 그 항목을 알려준다", () => {
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.get('button[aria-label="5점"]', { timeout: 8000 }).click();
    cy.contains("button", "평가 제출하기").click();
    cy.contains("만남 성사 여부는 필수로 선택해야 해요.").should("be.visible");
    cy.get("@submitMemberReview.all").should("have.length", 0);
  });

  it("그룹 평가에서 별점만 비운 채 누르면 다음 멤버로 넘어가지 않는다", () => {
    cy.visit("/chat/group/2/rate");
    cy.wait("@getMemberReviews");
    cy.contains("민지", { timeout: 8000 }).should("be.visible");

    cy.contains("button", "만났어요").click();
    cy.contains("button", "다음 멤버 평가하기").should("have.attr", "aria-disabled", "true").click();
    cy.contains("별점은 필수로 선택해야 해요.").should("be.visible");
    cy.contains("민지").should("be.visible");
    cy.get("@submitMemberReview.all").should("have.length", 0);
  });

  // 비속어가 든 코멘트는 보내지 않는다(2026-10-04 QA). 금칙어 목록은 채팅과 같다.
  it("비속어가 든 한줄 코멘트는 제출하지 않는다", () => {
    let submitted = false;
    cy.intercept("PUT", "**/api/v1/member-reviews/*/targets/*", (req) => {
      submitted = true;
      req.reply({ statusCode: 500, body: {} });
    });
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.contains("button", "채팅만 했어요", { timeout: 8000 }).click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("시발 재밌어요");
    cy.contains("코멘트에 사용할 수 없는 표현이 있어요.").should("be.visible");
    cy.get('textarea[aria-label="한줄 코멘트"]').blur();
    cy.contains("button", "평가 제출하기").click();

    cy.location("pathname").should("include", "/rate");
    cy.then(() => expect(submitted, "제출 요청").to.equal(false));

    // 고치면 다시 보낼 수 있다.
    cy.get('textarea[aria-label="한줄 코멘트"]').clear().type("재밌어요").blur();
    cy.get('textarea[aria-label="한줄 코멘트"]').should("not.have.attr", "aria-invalid");
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

    // 평가 목록에 방 3의 그룹 평가가 있어야 진입 버튼이 열린다(없으면 완료한 평가로 본다).
    cy.fixture("member-reviews.json").then((reviews: Record<string, unknown>[]) => {
      cy.intercept("GET", "**/api/**/member-reviews", {
        statusCode: 200,
        body: {
          success: true,
          data: reviews.map((review) =>
            review.matchType === "GROUP" ? { ...review, chatRoomId: 3 } : review,
          ),
        },
      }).as("getRoom3Reviews");
    });

    cy.visit("/chat/group/3");
    cy.wait("@getEndedGroupRoom");
    cy.wait("@getRoom3Reviews");

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
    cy.contains("button", "평가 제출하기").should("have.attr", "aria-disabled", "true");

    cy.contains("button", "약속 잡았어요").click();
    cy.get('button[aria-label="5점"]').click();
    cy.get('textarea[aria-label="한줄 코멘트"]').type("즐거웠어요");
    cy.contains("button", "평가 제출하기").should("not.exist");
    cy.get('textarea[aria-label="한줄 코멘트"]').blur();
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

describe("미평가 유도 (홈 첫 진입)", () => {
  beforeEach(() => {
    Cypress.env("reviewPrompt", true);
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  afterEach(() => {
    Cypress.env("reviewPrompt", false);
  });

  it("열린 평가가 있으면 가장 오래된 평가를 모달로 안내하고, 평가하기로 평가 화면에 들어간다", () => {
    cy.visit("/home");
    cy.wait("@getMemberReviews");

    // 픽스처 첫 평가(availableAt 가장 이른)는 1:1 방 1(수민)이다.
    cy.contains("지난 채팅은 어떠셨나요?").should("be.visible");
    cy.contains("수민님과의 채팅 평가가 아직 남아 있어요.").should("be.visible");
    cy.location("pathname").should("match", /^\/home\/?$/);

    cy.contains("button", "평가하기").click();
    cy.location("pathname", { timeout: 8000 }).should("include", "/chat/one-on-one/1/rate");

    cy.go("back");
    cy.location("pathname").should("match", /^\/home\/?$/);
    cy.wait(1000);
    cy.contains("지난 채팅은 어떠셨나요?").should("not.exist");
  });

  it("건너뛰기를 누르면 홈에 머물고 앱을 다시 켜도 다시 묻지 않는다", () => {
    cy.visit("/home");
    cy.wait("@getMemberReviews");

    cy.contains("button", "건너뛰기").click();
    cy.contains("지난 채팅은 어떠셨나요?").should("not.exist");
    cy.location("pathname").should("match", /^\/home\/?$/);

    cy.reload();
    cy.location("pathname").should("match", /^\/home\/?$/);
    cy.wait(1000);
    cy.contains("지난 채팅은 어떠셨나요?").should("not.exist");

    // 앱 재실행 = 새 웹뷰 세션. 세션 단위 확인 플래그가 비워져도 건너뛴 평가는 다시 묻지 않는다.
    cy.window().then((win) => win.sessionStorage.clear());
    cy.reload();
    cy.location("pathname").should("match", /^\/home\/?$/);
    cy.wait(1000);
    cy.contains("지난 채팅은 어떠셨나요?").should("not.exist");
  });

  it("건너뛴 뒤 새로 열린 평가는 다시 안내한다", () => {
    cy.visit("/home");
    cy.wait("@getMemberReviews");
    cy.contains("button", "건너뛰기").click();

    cy.fixture("member-reviews.json").then(
      (reviews: Array<{ targets: Array<Record<string, unknown>> } & Record<string, unknown>>) => {
        const [first] = reviews;
        const opened = {
          ...first,
          reviewId: 13,
          chatRoomId: 3,
          availableAt: "2026-06-06 09:00:00",
          targets: [{ ...first.targets[0], memberId: 30, nickname: "지우" }],
        };
        cy.intercept("GET", "**/api/**/member-reviews", {
          statusCode: 200,
          body: { success: true, data: [...reviews, opened] },
        }).as("reviewsWithNew");
      },
    );

    cy.window().then((win) => win.sessionStorage.clear());
    cy.reload();
    cy.wait("@reviewsWithNew");
    cy.contains("지우님과의 채팅 평가가 아직 남아 있어요.").should("be.visible");
  });

  it("평가 화면에서 건너뛴 평가는 홈에서 다시 안내하지 않는다", () => {
    cy.visit("/chat/one-on-one/1/rate");
    cy.wait("@getMemberReviews");

    cy.get('img[alt="close"]').click();
    cy.contains("button", "건너뛰기").click();
    cy.location("pathname").should("match", /^\/chat\/?$/);

    cy.visit("/home");
    cy.location("pathname").should("match", /^\/home\/?$/);
    cy.wait(1000);
    cy.contains("지난 채팅은 어떠셨나요?").should("not.exist");
  });

  it("열린 평가가 없으면 홈에 머문다", () => {
    cy.intercept("GET", "**/api/**/member-reviews", { statusCode: 200, body: { success: true, data: [] } }).as(
      "noReviews",
    );
    cy.visit("/home");
    cy.wait("@noReviews");
    cy.location("pathname").should("match", /^\/home\/?$/);
    cy.contains("지난 채팅은 어떠셨나요?").should("not.exist");
  });
});
