/**
 * 그룹 매칭 결과 화면 `/matching/group/` (ditto-fe#23).
 *
 * 그룹 주의 매칭 결과·매칭 실패(`MATCH_RESULT`·`NO_MATCH`)와 인원 미달(`GROUP_NOT_FORMED`) 알림이
 * 이 경로로 들어온다(BE 위키 Frontend-DeepLink-Guide). 홈 카드 버튼으로만 열리던 그룹 결과 모달을
 * URL 로 바로 띄운다. 화면 상태는 홈과 같은 기준(`groups[0]` + 서버 기간)으로 갈린다.
 */
describe("그룹 매칭 결과 화면 /matching/group/", () => {
  function visitGroupPage(groupMatchesFixture?: string) {
    cy.mockApi(groupMatchesFixture ? { groupMatchesFixture } : {});
    cy.login();
    cy.visit("/matching/group");
    cy.wait("@getGroupMatches");
  }

  describe("매칭 기간", () => {
    beforeEach(() => {
      cy.clockPeriod("MATCHING");
    });

    it("알림으로 들어오면 그룹 결과를 보여 주고 바로 참여할 수 있다", () => {
      visitGroupPage("matches-group.json");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("12개중 평균 8개 일치").should("be.visible");
      cy.contains("겜돌이님 외 3명").should("be.visible");

      // 아직 3명이 모이지 않은 수락 — 화면에 남아 인원 대기로 바뀐다.
      // (성사되면 모달이 닫히며 들어오기 전 화면으로 돌아간다.)
      cy.intercept("POST", "**/api/**/matches/group/*/accept", {
        statusCode: 200,
        body: {
          success: true,
          data: { groupMatchId: 5, quizSetId: 102, acceptedCount: 2, isFormed: false },
        },
      }).as("acceptNotFormed");

      cy.contains("button", "참여하기").click();
      cy.contains("이 그룹에 참여할까요?").should("be.visible");
      cy.contains("네, 참여할게요").click();

      cy.wait("@acceptNotFormed");
      cy.contains("그룹 참여를 신청했어요", { timeout: 6000 }).should("be.visible");
      cy.contains("button", "참여하기").should("not.exist");
    });

    it("이미 참여를 신청했으면 인원 대기 상태로 열린다", () => {
      visitGroupPage("matches-group-pending.json");

      cy.contains("그룹 참여를 신청했어요", { timeout: 6000 }).should("be.visible");
      cy.contains("button", "참여하기").should("not.exist");
    });

    it("이번 주 그룹 후보가 없으면(0004) 매칭 실패를 보여 준다", () => {
      visitGroupPage();

      cy.contains("진행 중인 매칭이 없어요", { timeout: 6000 }).should("be.visible");
      cy.contains("다음주에 다시 인연을 만들어 보세요.").should("be.visible");
    });
  });

  describe("대화 기간", () => {
    beforeEach(() => {
      cy.clockPeriod("CHATTING");
    });

    // GROUP_NOT_FORMED: 참여했지만 금요일 개방까지 3명이 모이지 않았다.
    it("인원 미달로 성사되지 못한 그룹은 매칭 실패로 보여 준다", () => {
      visitGroupPage("matches-group-pending.json");

      cy.contains("진행 중인 매칭이 없어요", { timeout: 6000 }).should("be.visible");
      cy.contains("그룹 참여를 신청했어요").should("not.exist");
    });
  });
});
