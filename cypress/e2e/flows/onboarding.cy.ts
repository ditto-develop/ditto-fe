describe("onboarding flow", () => {
  it("skips intro note onboarding, confirms completion, and returns home", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    cy.visit("/onboarding/intro");

    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "다음에 할래요").click();

    cy.location("pathname", { timeout: 6000 }).should("match", /^\/onboarding\/complete\/?$/);
    cy.contains("만남 준비 완료!", { timeout: 6000 }).should("be.visible");
    cy.contains("button", "시작하기").click();

    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
    cy.get('img[alt="Ditto"]', { timeout: 6000 }).should("be.visible");
  });

  // 최소 글자 수 제한은 없앴다(2026-09-08). 10자 미만도 그대로 저장된다.
  it("saves an intro note answer shorter than 10 characters", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.intercept("GET", "**/api/v1/users/me/intro-notes", {
      statusCode: 200,
      body: { success: true, data: { answers: [], completedCount: 0 } },
    }).as("getMyIntroNotesEmpty");
    cy.intercept("PUT", "**/api/v1/users/me/intro-notes/*", {
      statusCode: 200,
      body: { success: true, data: { answers: [], completedCount: 1 } },
    }).as("putIntroNote");
    cy.login();
    cy.visit("/onboarding/intro");

    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");
    cy.get("textarea").first().click().type("커피");
    cy.contains("button", "저장").click();

    cy.wait("@putIntroNote");
    cy.contains("10자 이상 작성해주세요").should("not.exist");
    // 저장되면 입력창이 저장된 답변 텍스트로 바뀐다.
    // 버튼을 누르는 사이 목록이 스크롤되므로 화면 안으로 되돌린 뒤 확인한다.
    cy.contains("커피").scrollIntoView().should("be.visible");
    cy.contains("1/10 질문 완료").scrollIntoView().should("be.visible");
  });

  // 편집 중에는 하단 CTA를 감춘다 — 키보드 위에 겹쳐 입력 영역이 좁아지기 때문.
  it("hides the bottom CTA while an answer is being edited", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.intercept("GET", "**/api/v1/users/me/intro-notes", {
      statusCode: 200,
      body: { success: true, data: { answers: [], completedCount: 0 } },
    }).as("getMyIntroNotesEmpty");
    cy.login();
    cy.visit("/onboarding/intro");

    cy.contains("button", "다 작성했어요", { timeout: 6000 }).should("be.visible");
    cy.get("textarea").first().click();
    cy.contains("button", "다 작성했어요").should("not.exist");
    cy.contains("button", "다음에 할래요").should("not.exist");

    // 저장/취소 없이 화면 다른 곳을 눌러 포커스만 잃어도(=키보드가 내려가도) CTA는 돌아온다.
    cy.contains("소개 노트 작성하기").click();
    cy.contains("button", "다 작성했어요").should("be.visible");

    // 다시 편집하면 또 감춰지고, 취소하면 돌아온다.
    cy.get("textarea").first().click();
    cy.contains("button", "다 작성했어요").should("not.exist");
    cy.contains("button", "취소").click();
    cy.contains("button", "다 작성했어요").should("be.visible");
  });

  // Q10은 필수다. 다른 답을 아무리 채워도 Q10이 비면 완료되지 않고, 어느 질문인지 화면에 표시된다.
  it("blocks completion and points at Q10 when the required answer is missing", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.fixture("intro-notes.json").then((notes: { answers: unknown[] }) => {
      cy.intercept("GET", "**/api/v1/users/me/intro-notes", {
        statusCode: 200,
        body: {
          success: true,
          // Q10(one-word)을 뺀 앞 9개만 채워 둔다.
          data: { answers: notes.answers.slice(0, 9), completedCount: 9 },
        },
      }).as("getMyIntroNotesWithoutRequired");
    });
    cy.login();
    cy.visit("/onboarding/intro");

    cy.wait("@getMyIntroNotesWithoutRequired");
    cy.contains("9/10 질문 완료", { timeout: 6000 }).should("be.visible");

    cy.contains("button", "다 작성했어요").click();

    cy.contains("필수 질문에 답해 주세요.").should("be.visible");
    cy.contains("필수 질문이에요. 이 질문에 답해야 완료할 수 있어요.").should("be.visible");
    cy.location("pathname").should("match", /^\/onboarding\/intro\/?$/);
  });

  /**
   * 하단 질문(Q10)을 눌렀을 때 키보드에 가리지 않아야 한다.
   *
   * 온보딩은 페이지가 아니라 안쪽 목록(BodyContainer)만 스크롤되는 구조라, 키보드가
   * 떠도 브라우저가 알아서 입력창을 화면 안으로 밀어 주지 않는다. 실제 키보드는 띄울 수
   * 없으니 `visualViewport` 로 키보드가 뜬 상태를 흉내 낸다.
   */
  it("brings the last question above the keyboard", () => {
    const KEYBOARD_HEIGHT = 336;

    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.intercept("GET", "**/api/v1/users/me/intro-notes", {
      statusCode: 200,
      body: { success: true, data: { answers: [], completedCount: 0 } },
    }).as("getMyIntroNotesEmpty");
    cy.login();
    cy.visit("/onboarding/intro");

    cy.contains("Q10. 나를 한 줄로 표현한다면?", { timeout: 6000 }).should("exist");

    cy.window().then((win) => {
      const viewport = win.visualViewport;
      if (!viewport) throw new Error("visualViewport 를 지원하지 않는 브라우저다");
      // 프로토타입의 getter 를 자기 속성으로 덮어 키보드가 뜬 높이를 흉내 낸다.
      Object.defineProperty(viewport, "height", {
        configurable: true,
        get: () => win.innerHeight - KEYBOARD_HEIGHT,
      });
    });

    cy.get("textarea").last().click();
    cy.window().then((win) => {
      win.visualViewport?.dispatchEvent(new Event("resize"));

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
