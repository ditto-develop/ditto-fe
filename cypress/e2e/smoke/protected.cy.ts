describe("protected routes", () => {
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.mockApi();
    cy.login();
  });

  it("renders /home", () => {
    cy.visit("/home");

    cy.get('img[alt="Ditto"]', { timeout: 6000 }).should("be.visible");
    cy.contains("홈").should("be.visible");
  });

  it("renders /quiz/current", () => {
    cy.visit("/quiz/current");

    cy.contains("처음 만난 사람과 가장 편한 대화 주제는?", { timeout: 6000 }).should("be.visible");
    cy.contains("가볍게 취미 이야기").should("be.visible");
  });

  it("renders /matching", () => {
    cy.visit("/matching");

    cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
    cy.contains("요청할 수 있는 후보가 없어요").should("be.visible");
  });

  it("renders /chat", () => {
    cy.visit("/chat");

    cy.contains("대화방", { timeout: 6000 }).should("be.visible");
    // 상대 닉네임은 방 목록의 counterpartMemberIds로 프로필을 조회해 채운다.
    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("be.visible");
  });
});
