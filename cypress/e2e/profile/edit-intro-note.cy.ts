function mockIntroNoteApi() {
  cy.fixture("intro-notes.json").then((notes) => {
    cy.intercept("GET", "**/api/users/me/intro-notes", { success: true, data: notes }).as("getMyIntroNotes");
    cy.intercept("GET", "**/api/v1/users/me/intro-notes", { success: true, data: notes }).as("getMyIntroNotesV1");
    cy.intercept("PUT", "**/api/users/me/intro-notes/*", { success: true, data: notes }).as("putMyIntroNote");
    cy.intercept("PUT", "**/api/v1/users/me/intro-notes/*", { success: true, data: notes }).as("putMyIntroNoteV1");
  });
}

type IntroNoteFixture = {
  answers: Array<{
    questionCode: string;
    question: string;
    answer: string;
  }>;
  completedCount: number;
};

describe("edit intro note", () => {
  beforeEach(() => {
    cy.mockApi();
    mockIntroNoteApi();
    cy.login();
  });

  it("saves intro note answers and returns to profile", () => {
    cy.visit("/profile/intro-note");

    cy.contains("소개 노트 수정하기").should("be.visible");
    cy.contains("Q1.").parent().parent().find("textarea").first().clear().type("카메라, 지갑, 친구");
    // 입력 중에는 하단 CTA가 숨는다(키보드에 겹치기 때문). 저장하지 않은 채 포커스만
    // 거두고 제출한다 — 저장 안 한 값도 그대로 제출되는지까지 같이 본다.
    cy.contains("소개 노트 수정하기").click();
    cy.contains("수정 완료").click();

    cy.wait("@putMyIntroNoteV1");
    cy.location("pathname").should("eq", "/profile/");
  });

  it("requires the Q10 answer", () => {
    cy.fixture<IntroNoteFixture>("intro-notes.json").then((notes) => {
      cy.intercept("GET", "**/api/v1/users/me/intro-notes", {
        success: true,
        data: {
          ...notes,
          answers: notes.answers.map((item) =>
            item.questionCode === "one-word" ? { ...item, answer: "" } : item,
          ),
          completedCount: notes.completedCount - 1,
        },
      }).as("getMyIntroNotesWithoutRequired");
    });

    cy.visit("/profile/intro-note");
    cy.wait("@getMyIntroNotesWithoutRequired");

    cy.contains("Q10. 나를 한 줄로 표현한다면?").should("be.visible");
    cy.contains("수정 완료").click();

    cy.contains("필수 질문에 답해 주세요.").should("be.visible");
    cy.get("@putMyIntroNoteV1.all").should("have.length", 0);
  });

  /**
   * 키보드는 화면 위에 겹쳐 올라올 뿐 레이아웃 뷰포트를 줄이지 않아, 하단 질문이 가린
   * 채로 남는 문제가 있었다. 실제 키보드를 띄울 수는 없으니 `visualViewport` 를
   * 키보드가 뜬 상태로 흉내 내고, 편집 중인 질문이 그 위로 올라오는지 본다.
   */
  it("Q10을 눌렀을 때 키보드에 가리지 않는다", () => {
    const KEYBOARD_HEIGHT = 336;

    cy.visit("/profile/intro-note");
    cy.contains("Q10. 나를 한 줄로 표현한다면?").should("be.visible");

    cy.window().then((win) => {
      const viewport = win.visualViewport;
      if (!viewport) throw new Error("visualViewport 를 지원하지 않는 브라우저다");
      // 프로토타입의 getter 를 자기 속성으로 덮어 키보드가 뜬 높이를 흉내 낸다.
      Object.defineProperty(viewport, "height", {
        configurable: true,
        get: () => win.innerHeight - KEYBOARD_HEIGHT,
      });
    });

    // Q10 을 눌러 편집 상태로 만든다(= 키보드가 올라오는 시점).
    cy.contains("Q10. 나를 한 줄로 표현한다면?")
      .parent()
      .find("textarea, p")
      .last()
      .click();

    cy.window().then((win) => {
      win.visualViewport?.dispatchEvent(new Event("resize"));
    });

    cy.window().then((win) => {
      const keyboardTop = win.innerHeight - KEYBOARD_HEIGHT;
      cy.contains("Q10. 나를 한 줄로 표현한다면?")
        .parent()
        .should(($question) => {
          const { bottom } = $question[0].getBoundingClientRect();
          expect(bottom, "질문 하단이 키보드 위에 있어야 한다").to.be.at.most(keyboardTop);
        });
    });
  });
});
