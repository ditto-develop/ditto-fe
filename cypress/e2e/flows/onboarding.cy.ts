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
});
