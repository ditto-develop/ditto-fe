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

  it("shows the saved answers and saves edits only on 수정 완료", () => {
    cy.visit("/profile/intro-note");
    cy.wait("@getMyIntroNotesV1");

    cy.contains("소개 노트 수정하기").should("be.visible");
    // 저장된 답변이 그대로 보여야 한다 — 다시 들어오면 전부 비어 있던 회귀(QA 2026-09-09).
    cy.contains("짐은 단출하게 챙기는 편이에요.").should("be.visible");
    cy.contains("따뜻함").should("be.visible");
    cy.contains("10/10 질문 완료").should("be.visible");

    // 저장된 답변을 눌러 편집한다.
    cy.contains("짐은 단출하게 챙기는 편이에요.").click();
    cy.contains("Q1.").parent().find("textarea").clear().type("카메라, 지갑, 친구");
    // 질문별 "저장"은 화면 안에서만 반영된다. 서버에는 "수정 완료"에서 한 번에 쓴다 —
    // 그래야 최소 3개·필수 질문 조건을 건너뛴 채 하나씩 저장되는 일이 없다.
    cy.contains("Q1.").parent().contains("button", "저장").click();
    cy.contains("카메라, 지갑, 친구").should("be.visible");
    cy.get("@putMyIntroNoteV1.all").should("have.length", 0);

    cy.contains("수정 완료").click();

    cy.wait("@putMyIntroNoteV1");
    cy.location("pathname").should("eq", "/profile/");
    cy.get("@putMyIntroNoteV1.all").should("have.length", 10);
  });

  it("submits typed but unsaved answers too", () => {
    cy.visit("/profile/intro-note");
    cy.wait("@getMyIntroNotesV1");

    cy.contains("따뜻함").click();
    cy.contains("Q10.").parent().find("textarea").clear().type("느긋한 사람");
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
   * 저장된 답변은 <p> 로 그려 두었다가 누르는 순간 입력창으로 바뀐다. 그래서 브라우저가
   * 주는 포커스가 없어, 한 번 눌러서는 커서도 키보드도 오지 않고 두 번 눌러야 했다(QA 2026-09-10).
   */
  it("저장된 답변을 한 번 누르면 바로 입력할 수 있다", () => {
    cy.visit("/profile/intro-note");
    cy.wait("@getMyIntroNotesV1");

    cy.contains("짐은 단출하게 챙기는 편이에요.").click();

    cy.document().should((doc) => {
      expect(doc.activeElement?.tagName, "포커스된 요소").to.eq("TEXTAREA");
      expect(
        (doc.activeElement as HTMLTextAreaElement).value,
        "포커스된 입력창의 값",
      ).to.eq("짐은 단출하게 챙기는 편이에요.");
    });
  });

  /**
   * 편집이 끝나면 화면을 원점(0,0)으로 되돌리던 코드가 있었다. 문서 전체가 스크롤되는
   * 이 화면에서는 답변 하나를 저장할 때마다 맨 위로 튀었다(QA 2026-09-10).
   */
  it("저장/취소해도 보던 질문 자리에 남는다", () => {
    cy.viewport("iphone-x");
    cy.visit("/profile/intro-note");
    cy.wait("@getMyIntroNotesV1");

    cy.contains("Q8.").scrollIntoView();
    cy.window().its("scrollY").as("beforeY");

    cy.contains("Q8.").parent().find("textarea, p").last().click();
    cy.contains("Q8.").parent().contains("button", "취소").click();

    cy.get("@beforeY").then((beforeY) => {
      const before = Number(beforeY);
      expect(before, "편집 전 스크롤 위치").to.be.greaterThan(0);
      cy.window().should((win) => {
        expect(win.scrollY, "취소 후 스크롤 위치").to.be.closeTo(before, 120);
      });
    });
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
