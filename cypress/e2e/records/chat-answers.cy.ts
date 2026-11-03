/**
 * 8.1.1 · 8.1.2 대화방 "우리의 답변"(공개 전 — 테스터 모드, src/shared/lib/featureFlags.ts 의 records).
 *
 * 운영 BE 에 아직 없는 API(GET quiz-answers · POST quiz-shares)라 여기서 목킹한다.
 * 픽스처(cypress/fixtures/records/room-*.json)는 MSW 목업(src/mocks/recordsData.ts)에서 뽑은 값이다.
 */

/** getMyMemberId 가 1 을 읽는 토큰 — 픽스처의 "나"(memberId 1). */
const MEMBER_1_TOKEN = `e30.${btoa(JSON.stringify({ sub: "1", exp: 4102444800 }))}.test`;

/** 방 1 = 1:1, 방 3 = 그룹. 그 밖의 방은 퀴즈로 만든 방이 아니라 404. */
function mockRoomQuizAnswers() {
  cy.fixture("records/room-quiz-answers-1on1.json").then((oneOnOne) => {
    cy.fixture("records/room-quiz-answers-group.json").then((group) => {
      cy.intercept("GET", "**/api/**/chat/rooms/*/quiz-answers", (req) => {
        const roomId = new URL(req.url).pathname.match(/\/chat\/rooms\/([^/]+)\//)?.[1];
        const data = roomId === "1" ? oneOnOne : roomId === "3" ? group : null;
        if (!data) {
          req.reply({
            statusCode: 404,
            body: { success: false, data: null, error: { code: "0004", message: "없음", statusCode: 404 } },
          });
          return;
        }
        req.reply({ statusCode: 200, body: { success: true, data } });
      }).as("getRoomQuizAnswers");
    });
  });
}

describe("8.1 대화방 우리의 답변 — 테스터 모드", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login({ accessToken: MEMBER_1_TOKEN });
    mockRoomQuizAnswers();
    cy.enableTesterMode();
  });

  it("1:1 방: 요약 바 → 우리의 답변 → 이 질문으로 말 걸기 → 빈 글로 보내면 문항 카드가 올라간다", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getRoomQuizAnswers");

    cy.get('[data-cy="room-answers-summary"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "같은 답 7 · 다른 답 5");
    cy.get('[data-cy="room-first-hint"]')
      .should("contain", "첫 대화 힌트")
      .and("contain", "두 분 모두 시간이 멈춘다면")
      .and("contain", "새벽 2시를 골랐어요. 그 시간엔 주로 뭘 하세요?");

    cy.contains("button", "우리의 답변 보기").click();
    cy.get('[data-cy="room-answers-page"]').within(() => {
      cy.contains("12개 질문 중").should("be.visible");
      cy.contains("7개가 같아요").should("be.visible");
      cy.contains("는 전체의 18%만 고른 답이에요").should("exist");
      cy.contains("같은 답 7").should("exist");
      cy.contains("다른 답 5").should("exist");
      // 보낸 이력이 있는 문항(Q2)은 말 걸기가 꺼져 있다.
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

    cy.fixture("records/room-quiz-answers-1on1.json").then((answers) => {
      const question = answers.questions[0];
      cy.intercept("POST", "**/api/**/chat/rooms/1/quiz-shares", (req) => {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              id: 9000,
              roomId: 1,
              senderId: 1,
              messageType: "QUIZ",
              content: req.body.content ?? "",
              imageUrl: null,
              unreadCount: 1,
              createdAt: "2026-06-06 11:50:00",
              quiz: {
                quizId: question.quizId,
                order: question.order,
                question: question.question,
                prompt: question.prompt,
                choices: question.choices.map(
                  (choice: { choiceId: number; content: string; memberCount: number; memberIds: number[] }) => ({
                    choiceId: choice.choiceId,
                    content: choice.content,
                    memberCount: choice.memberCount,
                    memberIds: choice.memberIds,
                  }),
                ),
              },
            },
          },
        });
      }).as("shareQuiz");
    });

    // 텍스트가 없어도 전송 버튼이 켜져 있다(Figma 주석).
    cy.get('img[alt="전송"]').parent("button").should("not.be.disabled").click();
    cy.wait("@shareQuiz").its("request.body").should("deep.equal", { quizId: 4201 });

    cy.get('[data-cy="chat-quiz-card"]')
      .should("be.visible")
      .and("contain", "Q1. 커튼을 열면 보이는 색은?")
      .and("contain", "나 · 노을빛");
    cy.get('[data-cy="room-quiz-attachment"]').should("not.exist");
    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').should("exist");
  });

  it("그룹 방: 첫 진입 툴팁은 한 번만, 우리 그룹의 답변은 반반·다 같이·나머지로 나뉜다", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getRoomQuizAnswers");

    cy.get('[data-cy="room-answers-tooltip"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "우리 그룹의 답변")
      .and("contain", "질문에 고른 답변을 볼 수 있어요");
    // 진행 중 투표가 있으면 요약 바 대신 투표 배너가 뜬다.
    cy.contains("만남 투표 진행 중").should("be.visible");
    cy.get('[data-cy="room-answers-summary"]').should("not.exist");
    cy.get('[data-cy="room-first-hint"]').should("contain", "네 분 모두 고민이 생기면");

    cy.get('button[aria-label="안내 닫기"]').click();
    cy.get('[data-cy="room-answers-tooltip"]').should("not.exist");
    cy.reload();
    cy.wait("@getRoomQuizAnswers");
    cy.get('[data-cy="room-answers-button"]', { timeout: 8000 }).should("be.visible");
    cy.get('[data-cy="room-answers-tooltip"]').should("not.exist");

    cy.get('[data-cy="room-answers-button"]').click();
    cy.get('[data-cy="room-answers-page"]').within(() => {
      cy.contains("4명이 12개 질문 중").should("be.visible");
      cy.contains("4개를 다 같이 골랐어요").should("be.visible");
      cy.contains("누가 어떤 답을 골랐는지는 보이지 않아요. 내 답만 표시돼요.").should("exist");
      cy.contains("반반 갈린 질문 4").should("exist");
      cy.contains("이야기거리 1순위").should("exist");
      cy.contains("다 같이 고른 답 4").should("exist");
      cy.contains("나머지 질문 4").should("exist");
      cy.contains("button", "대화방에 이 질문 올리기").should("exist");
    });
  });

  it("그룹 방: 진행 중 투표가 없으면 그 자리에 검은 요약 바가 뜬다", () => {
    cy.intercept("GET", "**/api/**/chat/rooms/*/votes", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("getNoVotes");

    cy.visit("/chat/group/3");
    cy.wait("@getRoomQuizAnswers");
    cy.get('[data-cy="room-answers-summary"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "다 같은 답 4 · 반반 4");
    cy.contains("만남 투표 진행 중").should("not.exist");
  });
});

describe("8.1 대화방 우리의 답변 — 테스터 모드 꺼짐", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login({ accessToken: MEMBER_1_TOKEN });
    mockRoomQuizAnswers();
  });

  it("1:1·그룹 방 어디에도 진입점이 없고 API 도 부르지 않는다", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");
    cy.contains("안녕하세요, 반가워요!", { timeout: 8000 }).should("exist");
    cy.get('[data-cy="room-answers-summary"]').should("not.exist");
    cy.get('[data-cy="room-first-hint"]').should("not.exist");
    cy.get('[data-cy="room-answers-button"]').should("not.exist");

    cy.visit("/chat/group/3");
    cy.wait("@getChatMessages");
    cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("exist");
    cy.get('[data-cy="room-answers-tooltip"]').should("not.exist");
    cy.get('[data-cy="room-answers-button"]').should("not.exist");

    cy.get("@getRoomQuizAnswers.all").should("have.length", 0);
  });

  it("다른 사람이 보낸 문항 카드(QUIZ)는 테스터 모드와 상관없이 그린다", () => {
    cy.fixture("chat-messages.json").then((page: { messages: unknown[]; nextCursor: number | null }) => {
      cy.intercept("GET", "**/api/**/chat/rooms/1/messages*", {
        statusCode: 200,
        body: {
          success: true,
          data: {
            ...page,
            messages: [
              {
                id: 31,
                roomId: 1,
                senderId: 2,
                messageType: "QUIZ",
                content: "여기선 답이 갈렸네요. 왜 노을빛이에요?",
                imageUrl: null,
                unreadCount: 0,
                createdAt: "2026-06-05 17:10:00",
                quiz: {
                  quizId: 4201,
                  order: 1,
                  question: "커튼을 열면 보이는 색은?",
                  choices: [
                    { choiceId: 42011, content: "하늘빛", memberCount: 1, memberIds: [2] },
                    { choiceId: 42012, content: "노을빛", memberCount: 1, memberIds: [1] },
                  ],
                },
              },
              ...page.messages,
            ],
          },
        },
      }).as("quizMessages");
    });

    cy.visit("/chat/one-on-one/1");
    cy.wait("@quizMessages");
    cy.get('[data-cy="chat-quiz-card"]', { timeout: 8000 })
      .should("be.visible")
      .and("contain", "Q1. 커튼을 열면 보이는 색은?")
      .and("contain", "나 · 노을빛")
      .and("contain", "수민 · 하늘빛");
    cy.contains("여기선 답이 갈렸네요. 왜 노을빛이에요?").should("be.visible");
  });
});
