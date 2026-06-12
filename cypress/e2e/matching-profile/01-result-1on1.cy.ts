/**
 * Figma "3.1 매칭 & 프로필" — 3.1 매칭 결과 1:1 매칭 (WF-06)
 * node-id 673-12674
 *
 * /matching 페이지의 1:1 매칭 결과 리스트.
 * - 헤더(라벨/타이틀/설명/탭)
 * - 후보 카드(등급 라벨링, 일치 수, 프로필 미리보기)
 * - 요청하기 / 수락하기 탭 상태
 * - 상대가 신청한 카드 상태 / 내가 신청한 카드 상태
 * - 빈 상태
 * - 프로필 카드 → 소개노트 진입
 */
describe("3.1 매칭 결과 - 1:1 매칭 (WF-06)", () => {
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.login();
  });

  describe("헤더", () => {
    it("라벨 · 타이틀 · 설명 · 탭이 노출된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("1:1 매칭", { timeout: 6000 }).should("be.visible");
      cy.contains("이번 주 매칭 결과").should("be.visible");
      cy.contains("나와 가장 비슷한 답을 한 사람들을 찾았어요.").should("be.visible");
      cy.contains("요청하기").should("be.visible");
      cy.contains("수락하기").should("be.visible");
    });
  });

  describe("후보 카드 — 프로필 미리보기 + 등급 라벨링", () => {
    beforeEach(() => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");
    });

    it("등급 라벨과 일치 수가 노출된다", () => {
      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("🌟 당신과 가장 비슷해요").should("be.visible");
      cy.contains("12개중 11개 일치").should("be.visible");
    });

    it("닉네임 · 나이 · 성별 · 지역 · 한줄소개가 노출된다", () => {
      cy.contains("수민", { timeout: 6000 }).should("be.visible");
      cy.contains("여행과 커피를 좋아해요.").should("be.visible");
    });
  });

  describe("요청하기 탭", () => {
    it("받은 요청이 없는 후보가 요청하기 탭에 노출된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수민").should("be.visible");
    });

    it("요청할 후보가 없으면 빈 상태가 노출된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-all-received.json", matchingStatusFixture: "matching-status-all-received.json" });
      cy.visit("/matching");

      cy.contains("요청할 수 있는 후보가 없어요", { timeout: 6000 }).should("be.visible");
      cy.contains("이번 주 매칭된 후보가 모두 나에게 먼저 연락했어요").should("be.visible");
    });
  });

  describe("수락하기 탭", () => {
    it("상대가 신청한 후보가 수락하기 탭에 노출되고 상태 문구가 보인다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-received.json", matchingStatusFixture: "matching-status-received.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수락하기").click();

      cy.contains("수민").should("be.visible");
      cy.contains("상대가 대화를 신청했어요").should("be.visible");
    });

    it("받은 요청이 없으면 빈 상태가 노출된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수락하기").click();

      cy.contains("아직 받은 요청이 없어요").should("be.visible");
      cy.contains("나와 닮은 누군가가 용기를 내고 있을지도 몰라요").should("be.visible");
    });
  });

  describe("프로필 카드 → 소개노트 진입", () => {
    it("후보 카드를 누르면 해당 프로필 소개노트로 이동한다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("수민", { timeout: 6000 }).click();
      cy.location("pathname", { timeout: 6000 }).should("match", /^\/profile\/501\/?$/);
      cy.contains("대화 신청하기").should("be.visible");
    });
  });
});
