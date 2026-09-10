/**
 * 퀴즈 화면 이동 — QA 2026-09-09.
 *
 * - 뒤로가기는 이전 문항으로 돌아간다(이어서/새로 풀기 안내가 아니라).
 * - 이어서/새로 풀기 안내는 답한 문항이 남아 있는 채로 다시 들어왔을 때만 뜬다(Figma 1112:8841).
 * - 홈에서 고른 종류의 세트가 이번 주에 없으면 다른 종류로 대체하지 않는다.
 * - 참여 완료 화면의 "알림받기"는 매칭 알림을 켜고 홈으로 돌아간다.
 */

const FIRST_QUESTION = "처음 만난 사람과 가장 편한 대화 주제는?";
const SECOND_QUESTION = "주말 약속은 어떤 방식이 좋아요?";

/** quiz-current.json 의 두 문항 중 첫 문항만 답한 상태. */
function mockPartialProgress() {
  cy.intercept("GET", "**/api/**/quiz-progress/quiz-sets/*", {
    success: true,
    data: {
      quizzes: [
        { id: "1001", question: FIRST_QUESTION, quizSetId: "101", choices: [], order: 1, userAnswer: 2001 },
        { id: "1002", question: SECOND_QUESTION, quizSetId: "101", choices: [], order: 2, userAnswer: null },
      ],
      totalCount: 2,
    },
  }).as("getPartialProgress");
}

describe("quiz navigation", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
  });

  it("goes back to the previous question", () => {
    cy.visit("/quiz/current?type=ONE_TO_ONE");

    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains(SECOND_QUESTION, { timeout: 6000 }).should("be.visible");
    cy.contains("2/2 질문 완료").should("be.visible");

    cy.get('img[alt="back"]').click();

    cy.contains(FIRST_QUESTION).should("be.visible");
    cy.contains("1/2 질문 완료").should("be.visible");
    cy.contains("퀴즈를 이어서 풀까요?").should("not.exist");
    // 다시 고를 수 있다 — 서버가 답을 덮어쓴다.
    cy.contains("button", "최근 인상 깊었던 일").should("be.visible");
  });

  it("asks whether to resume when answers are already saved", () => {
    mockPartialProgress();
    cy.intercept("POST", "**/api/**/quiz-progress/reset", { success: true, data: null }).as("resetProgress");

    cy.visit("/quiz/current?type=ONE_TO_ONE");
    cy.wait("@getPartialProgress");

    cy.contains("퀴즈를 이어서 풀까요?", { timeout: 6000 }).should("be.visible");
    cy.contains("이어서 풀기").click();
    cy.contains("퀴즈를 이어서 풀까요?").should("not.exist");
    cy.contains(SECOND_QUESTION).should("be.visible");
    cy.contains("2/2 질문 완료").should("be.visible");
  });

  it("clears saved answers on 새로 풀기 and returns to the quiz type sheet", () => {
    mockPartialProgress();
    cy.intercept("POST", "**/api/**/quiz-progress/reset", { success: true, data: null }).as("resetProgress");

    cy.visit("/quiz/current?type=ONE_TO_ONE");
    cy.contains("퀴즈를 이어서 풀까요?", { timeout: 6000 }).should("be.visible");
    // 안내 문구("…새로 풀기를 눌러주세요")가 아니라 버튼을 누른다.
    cy.contains(/^새로 풀기$/).click();

    cy.wait("@resetProgress");
    cy.location("pathname", { timeout: 6000 }).should("eq", "/home/");
    cy.contains("퀴즈의 종류를 선택하세요", { timeout: 6000 }).should("be.visible");
  });

  it("does not show another type's quiz when the requested type has no set this week", () => {
    // quiz-current.json 에는 1:1 세트만 있다.
    cy.visit("/quiz/current?type=GROUP");

    cy.contains("이번 주 그룹 매칭 퀴즈가 아직 없어요", { timeout: 6000 }).should("be.visible");
    cy.contains(FIRST_QUESTION).should("not.exist");
  });

  it("only offers quiz types that are open this week", () => {
    cy.visit("/home");

    cy.contains("button", "시작하기", { timeout: 8000 }).click();
    cy.wait("@getCurrentWeekQuiz");
    cy.contains("퀴즈의 종류를 선택하세요").should("be.visible");
    cy.contains("1:1 매칭").should("be.visible");
    cy.contains("그룹 매칭").should("not.exist");
  });

  it("turns on matching notifications from the finish screen", () => {
    cy.intercept("PATCH", "**/api/**/users/me/notification-settings", (req) => {
      req.reply({ success: true, data: { matching: true, chat: true, marketing: false } });
    }).as("patchNotificationSettings");

    cy.visit("/quiz/current?type=ONE_TO_ONE");
    cy.contains("button", "가볍게 취미 이야기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("button", "미리 계획 세우기", { timeout: 6000 }).click();
    cy.wait("@submitAnswer");
    cy.contains("퀴즈 참여 완료", { timeout: 6000 }).should("be.visible");

    cy.contains("button", "알림받기").click();

    cy.wait("@patchNotificationSettings").its("request.body").should("deep.include", { matching: true });
    cy.contains("매칭 결과가 나오면 알려드릴게요.").should("be.visible");
    cy.location("pathname", { timeout: 6000 }).should("eq", "/home/");
  });
});
