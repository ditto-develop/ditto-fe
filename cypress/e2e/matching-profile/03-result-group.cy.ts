/**
 * Figma "3.1 매칭 & 프로필" — 3.1 매칭 결과 그룹 매칭 (WF-07)
 * node-id 673-12674
 *
 * 그룹 매칭 결과는 홈(/home)에서 그룹 후보가 있을 때 "대화 신청하기"로 진입하는 모달이다.
 * - 그룹 결과 모달(평균 일치, 그룹 카드, 멤버 정보)
 * - 프로필 선택 → 멤버 소개노트
 * - 참여하기 → 확인 모달 → (3명 이상) 매칭 완료 / (3명 미만) 참여 신청 대기
 * - 거절하기 → 확인 모달 → 매칭 실패
 */
describe("3.1 매칭 결과 - 그룹 매칭 (WF-07)", () => {
  // 그룹 매칭 진입은 매칭 기간(/home)에서만 노출 → 시계를 매칭 기간으로 고정.
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-group.json" });
    cy.login();
  });

  function openGroupModal() {
    cy.visit("/home");
    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("대화 신청하기").click();
    cy.contains("그룹 매칭", { timeout: 6000 }).should("be.visible");
  }

  describe("그룹 결과 모달", () => {
    it("그룹 매칭 헤더 · 평균 일치 · 그룹 카드 · 멤버 수가 노출된다", () => {
      openGroupModal();

      cy.contains("이번 주 매칭 결과").should("be.visible");
      cy.contains("3명 이상이 참여하면 대화를 나눌 수 있어요").should("be.visible");
      cy.contains("12개중 평균 8개 일치").should("be.visible");
      cy.contains("같은 취미, 취향 그룹").should("be.visible");
      cy.contains("댕이누나님 외 3명").should("be.visible");
      cy.contains("거절하기").should("be.visible");
      cy.contains("button", "참여하기").should("exist").and("not.be.disabled");
    });
  });

  describe("프로필 선택 → 멤버 소개노트", () => {
    it("그룹 카드를 누르면 프로필 선택 시트가 열리고 멤버 소개노트를 볼 수 있다", () => {
      openGroupModal();

      cy.contains("같은 취미, 취향 그룹").click();
      cy.contains("프로필 선택", { timeout: 6000 }).should("be.visible");
      // "댕이누나"는 그룹 카드("댕이누나님 외 3명")에도 있어 모호 → 멤버 리스트 전용 닉네임으로 검증
      cy.contains("겜돌이").should("be.visible");

      cy.contains("겜돌이").click();
      // 멤버 상세(소개노트) 모달 진입 — 모달 상단 Q&A 질문으로 검증
      cy.contains("Q10. 나를 한 줄로 표현한다면?", { timeout: 6000 }).should("be.visible");
    });
  });

  describe("참여 플로우", () => {
    it("참여 → 확인 모달 → (3명 이상) 매칭 완료로 전환된다", () => {
      openGroupModal();

      cy.contains("참여하기").click();
      cy.contains("이 그룹에 참여할까요?").should("be.visible");
      cy.contains("한 번 참여하기를 선택하면 취소할 수 없어요.").should("be.visible");
      cy.contains("네, 참여할게요").click();

      cy.wait("@joinGroupMatch");
      cy.contains("그룹에 참여했어요! 대화는 금요일에 시작 돼요", { timeout: 6000 }).should("be.visible");
      cy.contains("매칭 완료").should("be.visible");
      cy.contains("만남이 이루어졌어요!").should("be.visible");
    });

    it("참여 → (3명 미만) 참여 신청 대기 상태가 노출된다", () => {
      // 참여 결과를 isActive=false로 override (3명 미만)
      cy.intercept("POST", "**/api/**/matches/group/join", {
        statusCode: 200,
        body: {
          success: true,
          data: { roomId: "group-room-1", quizSetId: "101", participantCount: 1, isActive: false },
        },
      }).as("joinGroupPending");

      openGroupModal();

      cy.contains("참여하기").click();
      cy.contains("이 그룹에 참여할까요?").should("be.visible");
      cy.contains("네, 참여할게요").click();

      cy.wait("@joinGroupPending");
      cy.contains("그룹 참여를 신청했어요. 3명 이상이 참여하면 금요일에 대화가 시작돼요.", { timeout: 6000 }).should("be.visible");
      cy.contains("그룹 참여를 신청했어요").should("be.visible");
    });
  });

  describe("거절 플로우", () => {
    it("거절 → 확인 모달 → 매칭 실패 빈 상태로 전환된다", () => {
      openGroupModal();

      // 하단 좌측 버튼은 dev 전용 오버레이에 일부 가려질 수 있어 force 클릭
      cy.contains("거절하기").click({ force: true });
      cy.contains("그룹 참여를 거절할까요?").should("be.visible");
      cy.contains("거절하면 이번 주 그룹 대화에는 참여할 수 없습니다.").should("be.visible");
      cy.contains("네, 거절할게요").click();

      cy.wait("@declineGroupMatch");
      cy.contains("진행 중인 매칭이 없어요.", { timeout: 6000 }).should("be.visible");
    });

    it("거절 모달에서 아니요를 누르면 모달만 닫힌다", () => {
      openGroupModal();

      cy.contains("거절하기").click({ force: true });
      cy.contains("그룹 참여를 거절할까요?").should("be.visible");

      cy.contains("아니요").click();
      cy.contains("그룹 참여를 거절할까요?").should("not.exist");
      cy.contains("참여하기").should("be.visible");
    });
  });
});
