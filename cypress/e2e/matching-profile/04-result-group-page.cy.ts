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

    it("알림으로 들어오면 그룹 결과를 보여 주고, 응답은 거절하기뿐이다", () => {
      visitGroupPage("matches-group.json");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("12개중 평균 8개 일치").should("be.visible");
      cy.contains("겜돌이님 외 3명").should("be.visible");

      // 거절하지 않으면 금 00:00에 서버가 참여로 처리한다(ditto-server #397) — 참여 버튼은 없다.
      cy.contains("거절하지 않으면 금요일 00:00에 자동으로 참여돼요.").should("be.visible");
      cy.contains("button", "참여하기").should("not.exist");

      cy.contains("button", "거절하기").click({ force: true });
      cy.contains("그룹 참여를 거절할까요?").should("be.visible");
      cy.contains("네, 거절할게요").click();
      cy.wait("@declineGroupMatch");
    });

    // 예전 앱에서 수락한 경우(서버는 예전 앱을 위해 수락 API 를 남겨 두었다).
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
