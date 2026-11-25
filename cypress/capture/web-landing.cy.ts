/**
 * 웹 다운로드 안내(/download) 그림용 앱 화면 캡처.
 *
 * 테스트가 아니라 산출물 생성 스크립트다(app-store.cy.ts 와 같은 규칙). 목업 데이터로 화면을 띄워
 * 393×798(상태 표시줄을 뺀 앱 영역)을 2배로 찍고, `npm run build:landing-shots` 가 상태 표시줄·폰
 * 테두리를 입혀 public/assets/download/ 에 넣는다. 앱 화면이 바뀌면 이 둘을 다시 돌리면 된다.
 *
 * 소개 화면이라 테스트 픽스처를 조금 보강한다(퀴즈 12문항, 매칭 후보 3명, 주고받는 대화).
 * 전부 지어낸 데이터다 — 실제 회원 정보는 쓰지 않는다.
 *
 * 실행:
 *   npm run dev:e2e            # 다른 터미널
 *   npm run capture:landing
 *   npm run build:landing-shots
 */

import { mockProfileAndSettings, shoot, visitScreen } from "./captureHelpers";

const CAPTURE = { connectedChatSocket: true, hideScrollbars: true };

/** 내 id(1)가 든 서명 없는 토큰. 대화방은 토큰의 sub 로 내 메시지를 가른다(getMyMemberId). */
function tokenForUser(userId: number) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: String(userId), exp: 4102444800 })}.capture`;
}

type Quiz = { id: string; order: number };
type QuizSet = { quizzes: Quiz[] };

/** 첫 문항을 12개로 늘린다. 화면에는 첫 문항과 "1/12 질문 완료"만 보인다. */
function toTwelve<T extends Quiz>(first: T): T[] {
  return Array.from({ length: 12 }, (_, index) => ({
    ...first,
    id: String(Number(first.id) + index),
    order: index + 1,
  }));
}

function mockTwelveQuestions() {
  cy.fixture("quiz-current.json").then((data: { quizSets: QuizSet[] }) => {
    const [first, ...rest] = data.quizSets;
    cy.intercept("GET", "**/api/**/quiz-sets/current-week", {
      success: true,
      data: { ...data, quizSets: [{ ...first, quizzes: toTwelve(first.quizzes[0]) }, ...rest] },
    });
  });
  cy.fixture("quiz-set-with-progress.json").then((data: { quizzes: (Quiz & { userAnswer: null })[] }) => {
    cy.intercept("GET", "**/api/**/quiz-progress/quiz-sets/*", {
      success: true,
      data: { quizzes: toTwelve(data.quizzes[0]), totalCount: 12 },
    });
  });
}

function mockThreeCandidates() {
  cy.fixture("matches-1on1-populated.json").then((data: { candidates: Record<string, unknown>[] }) => {
    const [first] = data.candidates;
    const candidate = (
      userId: number,
      nickname: string,
      age: number,
      location: string,
      introduction: string,
      avatar: string,
      matchedQuestions: number,
    ) => {
      const rate = Math.round((matchedQuestions / 12) * 100);
      return {
        ...first,
        userId,
        nickname,
        age,
        location,
        introduction,
        profileImageUrl: `/assets/avatar/${avatar}.png`,
        matchRate: rate,
        scoreBreakdown: { quizMatchRate: rate, matchedQuestions, totalQuestions: 12, reasons: [] },
      };
    };
    cy.intercept("GET", "**/api/**/matches/1on1*", {
      success: true,
      data: {
        ...data,
        candidates: [
          first,
          candidate(502, "하늘", 29, "gyeonggi", "주말엔 전시 보러 다녀요.", "f4", 10),
          candidate(503, "봄날", 26, "seoul", "강아지랑 산책하는 게 낙이에요.", "f6", 9),
        ],
      },
    });
  });
}

/** 수민(2)과 나(1)가 주고받는 대화. 서버처럼 최신 메시지가 앞에 온다. */
function mockConversation() {
  const lines: [sender: number, text: string, time: string][] = [
    [2, "안녕하세요! 반가워요 ☕", "16:40"],
    [1, "첫 질문에 같은 답 고르셨더라고요", "16:42"],
    [2, "맞아요 ㅎㅎ 취미 이야기가 제일 편해요", "16:45"],
    [1, "요즘 주말엔 뭐 하세요?", "16:51"],
    [2, "카페 투어 다니거나 한강 산책해요!", "16:55"],
    [1, "저도 한강 자주 가요. 같이 걸어요 🙂", "17:00"],
  ];
  const messages = lines
    .map(([senderId, content, time], index) => ({
      id: 100 + index,
      roomId: 1,
      senderId,
      messageType: "TEXT",
      content,
      imageUrl: null,
      createdAt: `2026-06-05 ${time}:00`,
    }))
    .reverse();
  cy.intercept("GET", "**/api/**/chat/rooms/1/messages*", {
    success: true,
    data: { messages, nextCursor: null },
  });
}

describe("웹 다운로드 안내 그림", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
  });

  it("hero-home — 홈(퀴즈 기간)", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    mockProfileAndSettings();
    visitScreen("/home", CAPTURE);
    cy.contains("이번주 퀴즈", { timeout: 12000 }).should("be.visible");
    shoot("hero-home");
  });

  it("hero-quiz-done — 퀴즈 참여 완료", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    mockProfileAndSettings();
    // 매칭 알림이 꺼진 사람으로 찍어 아래에 "알림받기 / 다음에 하기"가 보이게 한다.
    cy.intercept("GET", "**/api/**/users/me/notification-settings", {
      success: true,
      data: { matching: false, chat: true, marketing: false },
    });
    visitScreen("/quiz/current?type=ONE_TO_ONE", CAPTURE);
    cy.contains("button", "가볍게 취미 이야기", { timeout: 12000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("button", "미리 계획 세우기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("퀴즈 참여 완료", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "다음에 하기").should("be.visible");
    shoot("hero-quiz-done");
  });

  it("week-quiz — 퀴즈 문항", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    mockTwelveQuestions();
    cy.login();
    mockProfileAndSettings();
    visitScreen("/quiz/current?type=ONE_TO_ONE", CAPTURE);
    cy.contains("1/12", { timeout: 12000 }).should("be.visible");
    cy.contains("button", "가볍게 취미 이야기").should("be.visible");
    shoot("week-quiz");
  });

  it("week-match — 1:1 매칭 결과", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
    mockThreeCandidates();
    cy.login();
    mockProfileAndSettings();
    visitScreen("/matching", CAPTURE);
    cy.contains("이번 주 매칭 결과", { timeout: 12000 }).should("be.visible");
    cy.contains("봄날").should("be.visible");
    shoot("week-match");
  });

  it("week-chat — 1:1 대화방", () => {
    // 채팅방 픽스처는 대화 기간 창을 쓴다. 시계를 그 주에 고정하지 않으면 방이 만료돼 보인다.
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    mockConversation();
    cy.login({ accessToken: tokenForUser(1) });
    mockProfileAndSettings();
    visitScreen("/chat/one-on-one/1", CAPTURE);
    cy.contains("같이 걸어요", { timeout: 12000 }).should("be.visible");
    shoot("week-chat");
  });

  it("week-rate — 1:1 평가", () => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
    mockProfileAndSettings();
    visitScreen("/chat/one-on-one/1/rate", CAPTURE);
    cy.contains("수민님 평가", { timeout: 12000 }).should("be.visible");
    shoot("week-rate");
  });
});
