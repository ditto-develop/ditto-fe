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
});
