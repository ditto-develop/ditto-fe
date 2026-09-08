/**
 * 온보딩에서 "다음에 할래요"로 소개 노트를 건너뛴 사람은 퀴즈에 바로 들어갈 수 없다.
 * 홈의 "시작하기"를 누르면 소개 노트를 먼저 쓰라는 알럿이 뜨고, 거기서 작성 화면으로 간다.
 */
describe("quiz intro-note gate", () => {
  const mockIntroNoteCount = (completedCount: number) => {
    cy.fixture("intro-notes.json").then((notes: { answers: unknown[] }) => {
      // mockApi가 등록한 인터셉트보다 뒤에 등록해야 이 응답이 우선한다.
      ["**/api/v1/users/*/intro-notes", "**/api/users/*/intro-notes"].forEach((url) => {
        cy.intercept("GET", url, {
          statusCode: 200,
          body: {
            success: true,
            data: {
              answers: notes.answers.slice(0, completedCount),
              completedCount,
            },
          },
        });
      });
    });
  };

  beforeEach(() => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
  });

  it("blocks the quiz and routes to the intro note screen when fewer than 3 notes are written", () => {
    mockIntroNoteCount(1);
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "시작하기").click();

    cy.contains("소개 노트를 먼저 작성해주세요", { timeout: 6000 }).should("be.visible");
    cy.contains("퀴즈의 종류를 선택하세요").should("not.exist");

    cy.contains("button", "작성하러 가기").click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/onboarding\/intro\/?$/);
    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");
  });

  it("lets the quiz start once 3 notes are written", () => {
    mockIntroNoteCount(3);
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "시작하기").click();

    cy.contains("퀴즈의 종류를 선택하세요", { timeout: 6000 }).should("be.visible");
    cy.contains("소개 노트를 먼저 작성해주세요").should("not.exist");
  });
});
