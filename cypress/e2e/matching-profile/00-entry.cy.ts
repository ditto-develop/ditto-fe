/**
 * Figma "3.1 매칭 & 프로필" — 진입 (Entry)
 * node-id 673-12674
 *
 * 홈(/home)의 매칭 카드가 매칭 상태에 따라 진입 지점을 어떻게 노출하는지 검증한다.
 * - 1:1 결과 진입: "결과 확인" → /matching
 * - 그룹 결과 진입: "대화 신청하기" → 그룹 매칭 결과 모달
 * - 매칭 완료(1:1/그룹): "매칭 완료" 카드
 * - 매칭 실패: "진행 중인 매칭이 없어요." 빈 상태
 */
describe("진입 — 홈 매칭 카드", () => {
  // /home은 현재 KST 요일로 기간을 계산한다(getPeriodFromServerTime). 매칭 기간으로 고정.
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
  });

  describe("1:1 매칭 결과 진입", () => {
    beforeEach(() => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.login();
    });

    it("결과 확인 카드와 남은 시간이 노출된다", () => {
      cy.visit("/home");

      cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
      cy.contains("결과 확인").should("be.visible");
      cy.contains("소개 노트를 확인하고 대화를 신청해보세요").should("be.visible");
      cy.contains("남은 시간").should("be.visible");
    });

    it("결과 확인을 누르면 1:1 매칭 결과 페이지로 이동한다", () => {
      cy.visit("/home");

      cy.contains("결과 확인", { timeout: 6000 }).click();
      cy.location("pathname", { timeout: 6000 }).should("match", /^\/matching\/?$/);
      cy.contains("이번 주 매칭 결과").should("be.visible");
    });
  });

  describe("그룹 매칭 결과 진입", () => {
    beforeEach(() => {
      cy.mockApi({ matchesFixture: "matches-group.json" });
      cy.login();
    });

    it("대화 신청하기를 누르면 그룹 매칭 결과 모달이 열린다", () => {
      cy.visit("/home");

      cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
      cy.contains("대화 신청하기").click();

      cy.contains("그룹 매칭", { timeout: 6000 }).should("be.visible");
      cy.contains("3명 이상이 참여해야 대화가 시작돼요").should("be.visible");
    });
  });

  describe("매칭 완료 진입", () => {
    it("1:1 매칭 완료 시 '매칭 완료' 카드가 노출된다", () => {
      cy.mockApi({
        matchesFixture: "matches-1on1-populated.json",
        matchingStatusFixture: "matching-status-accepted.json",
      });
      cy.login();
      cy.visit("/home");

      cy.contains("매칭 완료", { timeout: 6000 }).should("be.visible");
      cy.contains("만남이 이루어졌어요!").should("be.visible");
      cy.contains("수민").should("be.visible");
    });

    it("그룹 매칭 완료 시 '매칭 완료' 그룹 카드가 노출된다", () => {
      cy.mockApi({
        matchesFixture: "matches-group.json",
        matchingStatusFixture: "matching-status-group-joined.json",
      });
      cy.login();
      cy.visit("/home");

      cy.contains("매칭 완료", { timeout: 6000 }).should("be.visible");
      cy.contains("만남이 이루어졌어요!").should("be.visible");
      cy.contains("같은 취미, 취향 그룹").should("be.visible");
    });
  });

  describe("매칭 실패 빈 상태", () => {
    beforeEach(() => {
      // 기본 matches fixture는 후보가 없음 → failmatch
      cy.mockApi();
      cy.login();
    });

    it("후보가 없으면 '진행 중인 매칭이 없어요.' 빈 상태가 노출된다", () => {
      cy.visit("/home");

      cy.contains("진행 중인 매칭이 없어요.", { timeout: 6000 }).should("be.visible");
      cy.contains("지금은 매칭 기간이에요!").should("be.visible");
      cy.contains("다음주에 다시 인연을 만들어 보세요.").should("be.visible");
    });
  });
});
