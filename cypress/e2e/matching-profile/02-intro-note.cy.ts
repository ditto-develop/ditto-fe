/**
 * Figma "3.1 매칭 & 프로필" — 3.2 소개노트
 * node-id 673-12674
 *
 * /profile/[id] 의 소개노트 화면. 진입 state(query param)에 따라 하단 CTA가 달라진다.
 * - before_request : 소개노트 미리보기 + "대화 신청하기" → 신청 모달 → 신청 완료
 * - after_acceptance : "거절하기" / "대화 수락하기" → 수락 모달 / 거절 모달
 * - completed : "대화 신청 완료" 비활성 버튼
 */
describe("3.2 소개노트", () => {
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.mockApi();
    cy.login();
  });

  const PROFILE = "/profile/501?quizSetId=101";

  describe("소개노트 미리보기 (before_request)", () => {
    beforeEach(() => {
      cy.visit(`${PROFILE}&state=before_request`);
    });

    it("프로필 정보와 소개노트 미리보기가 노출된다", () => {
      cy.contains("수민", { timeout: 6000 }).should("be.visible");
      cy.get("[data-testid='intro-note-preview-item']").should("have.length", 3);
      cy.get("[data-testid='intro-note-preview-item']").last().should("contain", "Q10.");
      cy.contains("Q10. 나를 한 줄로 표현한다면?").should("be.visible");
      cy.contains("대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요").should("be.visible");
      cy.contains("대화 신청하기").should("be.visible");
    });
  });

  // GET /api/v1/users/{id}/ratings — /users/me/ratings와 스키마도 공개 기준도 같다.
  // 서버가 공개 여부 플래그를 주지 않으므로 totalCount >= publicThreshold 로만 판정한다.
  describe("받은 평가", () => {
    it("공개 기준을 넘으면 평균·건수·코멘트 칩이 노출된다", () => {
      cy.visit(`${PROFILE}&state=before_request`);
      cy.wait("@getUserRatings");

      cy.contains("받은 평가", { timeout: 6000 }).should("be.visible");
      cy.contains("4.5").should("be.visible");
      cy.contains("(12)").should("be.visible");
      cy.contains("대화가 편하고 좋았어요").should("be.visible");
      cy.contains("약속 시간 잘 지켜요").should("be.visible");
    });

    it("공개 기준(3건) 미만이면 섹션 자체가 뜨지 않는다", () => {
      cy.intercept("GET", "**/api/v1/users/*/ratings", {
        success: true,
        data: {
          averageScore: 0,
          totalCount: 2,
          publicThreshold: 3,
          noShowCount: 0,
          ratings: [],
        },
      }).as("getUserRatingsPrivate");

      cy.visit(`${PROFILE}&state=before_request`);
      cy.wait("@getUserRatingsPrivate");

      cy.contains("수민", { timeout: 6000 }).should("be.visible");
      cy.contains("받은 평가").should("not.exist");
    });
  });

  describe("대화 신청 플로우", () => {
    beforeEach(() => {
      cy.visit(`${PROFILE}&state=before_request`);
      cy.contains("대화 신청하기", { timeout: 6000 }).should("be.visible");
    });

    it("신청 → 확인 모달 → 신청 완료 상태로 전환된다", () => {
      cy.contains("대화 신청하기").click();

      cy.contains("대화를 신청할까요?").should("be.visible");
      cy.contains("한 번 신청하면 취소할 수 없어요.").should("be.visible");
      cy.contains("네, 신청할게요").click();

      cy.wait("@sendMatchRequest");
      cy.contains("대화 신청 완료", { timeout: 6000 }).should("be.visible");
    });

    it("신청 모달에서 취소하면 모달만 닫힌다", () => {
      cy.contains("대화 신청하기").click();
      cy.contains("대화를 신청할까요?").should("be.visible");

      // 메시지("…취소할 수 없어요.")가 아닌 취소 버튼을 클릭
      cy.contains("button", "취소").click();
      cy.contains("대화를 신청할까요?").should("not.exist");
      cy.contains("대화 신청하기").should("be.visible");
    });
  });

  describe("대화 수락 플로우 (after_acceptance)", () => {
    beforeEach(() => {
      cy.visit(`${PROFILE}&matchRequestId=201&state=after_acceptance`);
      cy.contains("대화 수락하기", { timeout: 6000 }).should("be.visible");
    });

    it("수락/거절 CTA가 모두 노출된다", () => {
      cy.contains("거절하기").should("be.visible");
      cy.contains("대화 수락하기").should("be.visible");
    });

    it("수락 → 확인 모달 → 홈으로 이동하고 수락 스낵바가 노출된다", () => {
      cy.contains("대화 수락하기").click();

      cy.contains("대화 신청을 수락할까요?").should("be.visible");
      cy.contains("네, 수락할게요").click();

      cy.wait("@acceptMatchRequest");
      cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
      cy.contains("상대방이 대화를 수락했어요! 대화는 금요일에 시작돼요.").should("be.visible");
    });

    it("거절 → 확인 모달 → 홈으로 이동한다", () => {
      cy.contains("거절하기").click();

      cy.contains("대화 신청을 거절할까요?").should("be.visible");
      cy.contains("매칭 결과 페이지에서 상대가 삭제되고, 되돌릴 수 없어요.").should("be.visible");
      cy.contains("네, 거절할게요").click();

      cy.wait("@rejectMatchRequest");
      cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
    });

    it("거절 모달에서 아니오를 누르면 모달만 닫힌다", () => {
      cy.contains("거절하기").click();
      cy.contains("대화 신청을 거절할까요?").should("be.visible");

      cy.contains("아니오").click();
      cy.contains("대화 신청을 거절할까요?").should("not.exist");
      cy.contains("대화 수락하기").should("be.visible");
    });
  });

  describe("대화 신청 완료 상태 (completed)", () => {
    it("'대화 신청 완료' 비활성 버튼이 노출된다", () => {
      cy.visit(`${PROFILE}&state=completed`);

      cy.contains("수민", { timeout: 6000 }).should("be.visible");
      cy.contains("대화 신청 완료").should("be.visible");
      cy.contains("대화 신청하기").should("not.exist");
    });
  });
});
