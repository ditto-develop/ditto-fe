/**
 * 8.1.1 · 8.1.2 대화방 "우리의 답변"(서버 기능 플래그 `RECORDS` 뒤, src/shared/lib/featureFlags.ts).
 *
 * 서버 IMP-1 계약(ditto-server #366): GET quiz-compare(1:1) · quiz-distribution(그룹), 질문 카드는 STOMP
 * `QUIZ_CARD` 프레임, 첫 대화 힌트는 서버 메시지 `QUIZ_HINT`. 픽스처(cypress/fixtures/records/*)는
 * MSW 목업(src/mocks/recordsData.ts)에서 뽑은 값이다. Cypress 에는 STOMP 서버가 없어 카드 전송은
 * "연결이 끊긴" 경로만 확인한다.
 */

/** getMyMemberId 가 1 을 읽는 토큰 — 픽스처의 "나"(memberId 1). */
const MEMBER_1_TOKEN = `e30.${btoa(JSON.stringify({ sub: "1", exp: 4102444800 }))}.test`;

type Envelope = { success: boolean; data: unknown; error?: unknown };

function ok(data: unknown): { statusCode: number; body: Envelope } {
  return { statusCode: 200, body: { success: true, data } };
}

function fail(statusCode: number, code: string) {
  return { statusCode, body: { success: false, data: null, error: { code, message: code, statusCode } } };
}

/** 방 1 = 1:1, 방 3 = 그룹. 그 밖의 방은 퀴즈로 만든 방이 아니라 7012. */
function mockRoomQuizApis(compareOverride?: (data: Record<string, unknown>) => unknown) {
  cy.fixture("records/room-quiz-compare.json").then((compare: Record<string, unknown>) => {
    cy.intercept("GET", "**/api/**/chat/rooms/*/quiz-compare", (req) => {
      const roomId = new URL(req.url).pathname.match(/\/chat\/rooms\/([^/]+)\//)?.[1];
      req.reply(roomId === "1" ? ok(compareOverride ? compareOverride(compare) : compare) : fail(404, "7012"));
    }).as("getQuizCompare");
  });
  cy.fixture("records/room-quiz-distribution.json").then((distribution) => {
    cy.intercept("GET", "**/api/**/chat/rooms/*/quiz-distribution", (req) => {
      const roomId = new URL(req.url).pathname.match(/\/chat\/rooms\/([^/]+)\//)?.[1];
      req.reply(roomId === "3" ? ok(distribution) : fail(404, "7012"));
    }).as("getQuizDistribution");
  });
}

/** 방 메시지 첫 페이지에 서버가 남긴 첫 대화 힌트·질문 카드를 섞는다(id 최신순). */
function mockQuizMessages(roomId: 1 | 3) {
  const page = roomId === 1 ? "chat-messages.json" : "group-chat-messages.json";
  const extras = roomId === 1 ? "records/room-quiz-messages-1on1.json" : "records/room-quiz-messages-group.json";
  cy.fixture(page).then((base: { messages: Array<{ id: number }>; nextCursor: number | null }) => {
    cy.fixture(extras).then((quizMessages: Array<{ id: number }>) => {
      cy.intercept("GET", `**/api/**/chat/rooms/${roomId}/messages*`, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            ...base,
            messages: [...quizMessages, ...base.messages].sort((a, b) => b.id - a.id),
          },
        },
      }).as("quizMessages");
    });
  });
}

describe("8.1 대화방 우리의 답변 — 서버 RECORDS 켜짐", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login({ accessToken: MEMBER_1_TOKEN });
    mockRoomQuizApis();
  });

  it("1:1 방: 요약 바 → 우리의 답변 → 이 질문으로 말 걸기 → 연결이 없으면 담긴 질문을 남긴다", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getQuizCompare");

    cy.get('[data-cy="room-answers-summary"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "같은 답 7 · 다른 답 5");

    cy.contains("button", "우리의 답변 보기").click();
    cy.get('[data-cy="room-answers-page"]').within(() => {
      cy.contains("12개 질문 중").should("be.visible");
      cy.contains("7개가 같아요").should("be.visible");
      // highlightQuizId(Q3) — 같은 답 중 가장 드문 답.
      cy.contains("는 전체의 18%만 고른 답이에요").should("exist");
      cy.contains("같은 답 7").should("exist");
      cy.contains("다른 답 5").should("exist");
      // 이 방에 이미 올라온 문항(Q2, sent)은 말 걸기가 꺼져 있다.
      cy.get('button[aria-label="Q2 이 질문으로 말 걸기"]').should("be.disabled");
      cy.get('[data-cy="room-different-answer"]')
        .first()
        .scrollIntoView()
        .within(() => {
          cy.contains("Q1. 커튼을 열면 보이는 색은?").should("exist");
          cy.contains("노을빛").should("exist");
          cy.contains("하늘빛").should("exist");
          cy.contains("button", "이 질문으로 말 걸기").click();
        });
    });

    // 화면이 닫히고 입력창 위에 문항이 붙는다.
    cy.get('[data-cy="room-answers-page"]').should("not.exist");
    cy.get('[data-cy="room-quiz-attachment"]')
      .should("be.visible")
      .and("contain", "Q1. 커튼을 열면 보이는 색은?")
      .and("contain", "나 · 노을빛")
      .and("contain", "수민 · 하늘빛");
    cy.get('textarea[placeholder="한마디 덧붙여 보세요 (선택)"]').should("have.value", "");

    // 텍스트가 없어도 전송 버튼이 켜져 있다(Figma 주석). 카드는 STOMP 로만 가서 REST 를 부르지 않는다.
    cy.get('img[alt="전송"]').parent("button").should("not.be.disabled").click();
    cy.contains("연결이 끊겨 질문을 보내지 못했어요.").should("be.visible");
    cy.get('[data-cy="room-quiz-attachment"]').should("be.visible");
  });

  it("1:1 방: 끝난 방(7004)이면 요약 바와 문서 아이콘이 없다", () => {
    cy.intercept("GET", "**/api/**/chat/rooms/1/quiz-compare", fail(409, "7004")).as("endedCompare");
    cy.visit("/chat/one-on-one/1");
    cy.wait("@endedCompare");
    cy.contains("안녕하세요, 반가워요!", { timeout: 8000 }).should("exist");
    cy.get('[data-cy="room-answers-summary"]').should("not.exist");
    cy.get('[data-cy="room-answers-button"]').should("not.exist");
  });

  it("그룹 방: 첫 진입 툴팁은 한 번만, 우리 그룹의 답변은 반반·다 같이·나머지로 나뉜다", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getQuizDistribution");

    cy.get('[data-cy="room-answers-tooltip"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "우리 그룹의 답변")
      .and("contain", "질문에 고른 답변을 볼 수 있어요");
    // 진행 중 투표가 있으면 요약 바 대신 투표 배너가 뜬다.
    cy.contains("만남 투표 진행 중").should("be.visible");
    cy.get('[data-cy="room-answers-summary"]').should("not.exist");

    cy.get('button[aria-label="안내 닫기"]').click();
    cy.get('[data-cy="room-answers-tooltip"]').should("not.exist");
    cy.reload();
    cy.wait("@getQuizDistribution");
    cy.get('[data-cy="room-answers-button"]', { timeout: 8000 }).should("be.visible");
    cy.get('[data-cy="room-answers-tooltip"]').should("not.exist");

    cy.get('[data-cy="room-answers-button"]').click();
    cy.get('[data-cy="room-answers-page"]').within(() => {
      cy.contains("4명이 12개 질문 중").should("be.visible");
      cy.contains("4개를 다 같이 골랐어요").should("be.visible");
      cy.contains("누가 어떤 답을 골랐는지는 보이지 않아요. 내 답만 표시돼요.").should("exist");
      // 반반 갈린 질문은 서버 splitQuizIds(최대 3개) 그대로다.
      cy.contains("반반 갈린 질문 3").should("exist");
      cy.contains("이야기거리 1순위").should("exist");
      cy.contains("다 같이 고른 답 4").should("exist");
      cy.contains("나머지 질문 5").should("exist");
      cy.contains("button", "대화방에 이 질문 올리기").should("exist");
    });
  });

  it("그룹 방: 진행 중 투표가 없으면 그 자리에 검은 요약 바가 뜬다 — 반반은 만장일치가 아닌 문항 수", () => {
    cy.intercept("GET", "**/api/**/chat/rooms/*/votes", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("getNoVotes");

    cy.visit("/chat/group/3");
    cy.wait("@getQuizDistribution");
    cy.get('[data-cy="room-answers-summary"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "다 같은 답 4 · 반반 8");
    cy.contains("만남 투표 진행 중").should("not.exist");
  });
});

describe("8.1 대화방 우리의 답변 — 채팅 열리기 전(목요일)", () => {
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.mockApi();
    cy.login({ accessToken: MEMBER_1_TOKEN });
    // 방이 SCHEDULED 면 서버가 canSendCard=false 와 개방 시각(chatOpensAt)을 준다.
    mockRoomQuizApis((compare) => ({ ...compare, canSendCard: false }));
  });

  it("1:1 방: 채팅이 열리기 전에는 버튼이 딤드되고 열리는 시각을 알린다", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getQuizCompare");
    cy.contains("button", "우리의 답변 보기", { timeout: 8000 }).click();
    cy.get('[data-cy="room-answers-page"]').within(() => {
      cy.get('[data-cy="room-different-answer"]')
        .first()
        .scrollIntoView()
        .within(() => {
          cy.contains("button", "금요일 0시부터 보낼 수 있어요").should("be.disabled");
        });
      // 말풍선 아이콘은 눌러서 같은 안내를 본다.
      cy.get('button[aria-label="Q3 이 질문으로 말 걸기"]').scrollIntoView().click();
    });
    cy.contains("금요일 0시부터 보낼 수 있어요").should("be.visible");
    cy.get('[data-cy="room-quiz-attachment"]').should("not.exist");
  });
});

describe("8.1 대화방 우리의 답변 — 서버 RECORDS 꺼짐", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.mockFeatureFlags({ RECORDS: false });
    cy.login({ accessToken: MEMBER_1_TOKEN });
    mockRoomQuizApis();
  });

  it("1:1·그룹 방 어디에도 진입점이 없고 답변 API 도 부르지 않는다", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");
    cy.contains("안녕하세요, 반가워요!", { timeout: 8000 }).should("exist");
    cy.get('[data-cy="room-answers-summary"]').should("not.exist");
    cy.get('[data-cy="room-answers-button"]').should("not.exist");

    cy.visit("/chat/group/3");
    cy.wait("@getChatMessages");
    cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("exist");
    cy.get('[data-cy="room-answers-tooltip"]').should("not.exist");
    cy.get('[data-cy="room-answers-button"]').should("not.exist");

    cy.get("@getQuizCompare.all").should("have.length", 0);
    cy.get("@getQuizDistribution.all").should("have.length", 0);
  });

  it("서버가 남긴 첫 대화 힌트와 상대가 올린 질문 카드는 RECORDS 가 꺼져도 그린다", () => {
    mockQuizMessages(1);
    cy.visit("/chat/one-on-one/1");
    cy.wait("@quizMessages");

    cy.get('[data-cy="room-first-hint"]', { timeout: 8000 })
      .should("contain", "첫 대화 힌트")
      .and("contain", "“시간이 멈춘다면 그 시각은?”")
      .and("contain", "두 분 모두 새벽 2시를 골랐어요. 그 시간엔 주로 뭘 하세요?");
    // 상대가 보낸 카드 — 보낸 사람 기준 값을 보는 사람 기준으로 바꾼다. 둘 다 같은 답이면 칩 하나.
    cy.get('[data-cy="chat-quiz-card"]')
      .should("contain", "반려견 이름을 짓는다면?")
      .and("contain", "둘 다 후추")
      .and("contain", "그 이름엔 어떤 사연이 있어요?");
    // content 는 JSON 이다 — 원문이 말풍선에 새면 안 된다.
    cy.contains('"quizId"').should("not.exist");
  });

  it("그룹 방 첫 대화 힌트는 다 같이 고른 답으로 그린다", () => {
    mockQuizMessages(3);
    cy.visit("/chat/group/3");
    cy.wait("@quizMessages");

    cy.get('[data-cy="room-first-hint"]', { timeout: 8000 })
      .should("contain", "“고민이 생기면?”")
      .and("contain", "다 같이 혼자 정리하기를 골랐어요. 요즘 정리하고 싶은 고민이 있어요?");
    cy.contains('"quizId"').should("not.exist");
  });
});
