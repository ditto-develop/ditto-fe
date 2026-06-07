/**
 * Figma "3.1 매칭 & 프로필" — 프로필 상세 (WF-16)
 * node-id 673-12674
 *
 * WF-16 명세: 기본 정보 / 퀴즈 답변(일치율) / 받은 평가(3회 이상 공개).
 *
 * 현재 구현 상태:
 * - 매칭 성사(chat_started) 시 "상대 답변 비교"(GET /users/:id/answers) 뷰는 구현됨 → 실제 검증.
 * - 독립형 WF-16 프로필(기본정보 섹션 + 받은 평가 4.7) 화면은 아직 미구현 →
 *   GET /users/:id/ratings(user-ratings.json fixture 준비됨) 연동 시 활성화하도록 it.skip 으로 명세만 남김.
 */
describe("프로필 상세 (WF-16)", () => {
  beforeEach(() => {
    // 답변 비교(chat_started)는 매칭 성사 후 화면 — 매칭 기간으로 고정
    cy.clockPeriod("MATCHING");
    cy.mockApi();
    cy.login();
  });

  describe("매칭 성사 후 답변 비교 (chat_started) — 구현됨", () => {
    beforeEach(() => {
      cy.visit("/profile/501?quizSetId=101&state=chat_started");
    });

    it("프로필 정보와 퀴즈 답변 비교가 노출된다", () => {
      cy.wait("@getUserAnswers");

      cy.contains("수민", { timeout: 6000 }).should("be.visible");
      cy.contains("Q1. 여행갈 때 꼭 챙겨야 하는 3가지는?").should("be.visible");
      cy.contains("Q10. 나를 한 단어로 표현한다면?").should("be.visible");
    });

    it("내 답변과 상대 답변이 각각 표시된다", () => {
      cy.wait("@getUserAnswers");

      cy.contains("나 ·", { timeout: 6000 }).should("be.visible");
      cy.contains("상대 ·").should("be.visible");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // WF-16 독립형 프로필 화면 (기본정보 / 퀴즈답변 / 받은 평가)
  // 아직 미구현. 화면 구현 후 it.skip → it 으로 전환.
  //   - GET /users/:id/profile  → public-profile.json
  //   - GET /users/:id/answers  → answers-comparison.json
  //   - GET /users/:id/ratings  → user-ratings.json (averageScore 4.7, totalCount 30)
  // ──────────────────────────────────────────────────────────────
  describe("WF-16 독립형 프로필 (미구현 — 명세)", () => {
    it.skip("기본 정보 섹션(전체 공개)이 노출된다", () => {
      // GET /users/:id/profile 기반 닉네임 · 나이 · 성별 · 지역 · 직업 · 관심사
    });

    it.skip("퀴즈 답변 섹션에 일치율이 표시된다", () => {
      // GET /users/:id/answers 기반 매칭 일치율 + 문항별 답변
    });

    it.skip("받은 평가 섹션이 3회 이상일 때 평균 점수와 개수를 노출한다", () => {
      // GET /users/:id/ratings → "받은 평가" 4.7 (30)
    });
  });
});
