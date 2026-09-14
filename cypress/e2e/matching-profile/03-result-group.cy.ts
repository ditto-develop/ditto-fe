/**
 * Figma "3.1 매칭 & 프로필" — 3.1 매칭 결과 그룹 매칭 (WF-07)
 * node-id 673-12674
 *
 * 계약 정본: BE 위키 `Frontend-Group-Matching-Guide`.
 * 그룹 매칭은 선착순 방 배정이 아니라 **미리 짜인 후보 그룹에 수락/거절**하는 흐름이다.
 * 화면 상태는 전부 `GET /matches/group` 의 `groups[0]`에서 나온다.
 *
 * - 그룹 결과 모달(서버가 계산한 평균 일치, 그룹 카드, 멤버 정보)
 * - 프로필 선택 → 멤버 상세(후보 목록 카드 + 소개노트 미리보기 3문항)
 * - 참여 → 확인 모달 → (성사) 매칭 완료 / (미성사) 인원 대기
 * - 거절 → 다음 후보가 있으면 이어서, 없으면 매칭 실패
 * - 다른 기기에서 먼저 응답(5005/5006) → 목록 재조회
 */
describe("3.1 매칭 결과 - 그룹 매칭 (WF-07)", () => {
  // 그룹 매칭 진입은 매칭 기간(/home)에서만 노출 → 시계를 매칭 기간으로 고정.
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
  });

  function mockGroupWeek(groupMatchesFixture = "matches-group.json") {
    cy.mockApi({ groupMatchesFixture });
    cy.login();
  }

  function openGroupModal() {
    cy.visit("/home");
    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    cy.contains("대화 신청하기").click();
    cy.contains("그룹 매칭", { timeout: 6000 }).should("be.visible");
  }

  describe("그룹 결과 모달", () => {
    beforeEach(() => mockGroupWeek());

    it("그룹 매칭 헤더 · 평균 일치 · 그룹 카드 · 멤버 수가 노출된다", () => {
      openGroupModal();

      cy.contains("이번 주 매칭 결과").should("be.visible");
      cy.contains("3명 이상이 참여하면 대화를 나눌 수 있어요").should("be.visible");
      // 평균은 FE가 다시 계산하지 않고 서버의 averageMatchedQuestions/totalQuestions 를 그대로 쓴다.
      cy.contains("12개중 평균 8개 일치").should("be.visible");
      cy.contains("같은 취미, 취향 그룹").should("be.visible");
      // members 는 나를 뺀 목록이고 일치 수 내림차순이라 첫 멤버는 겜돌이(9문항)다.
      cy.contains("겜돌이님 외 3명").should("be.visible");
      cy.contains("거절하기").should("be.visible");
      cy.contains("button", "참여하기").should("exist").and("not.be.disabled");
    });
  });

  describe("프로필 선택 → 멤버 상세", () => {
    beforeEach(() => mockGroupWeek());

    it("그룹 카드를 누르면 프로필 선택 시트가 열리고 멤버 상세를 볼 수 있다", () => {
      openGroupModal();

      cy.contains("같은 취미, 취향 그룹").click();
      cy.contains("프로필 선택", { timeout: 6000 }).should("be.visible");
      // 개인 일치 수는 그룹 평균이 아니라 members[].scoreBreakdown.matchedQuestions 기준이다.
      cy.contains("12개중 9개 일치").should("be.visible");
      // 첫 멤버(겜돌이)는 그룹 카드 문구에도 있어 모호하다 → 두 번째 멤버로 검증한다.
      cy.contains("댕이누나").should("be.visible");

      /*
       * 성사 전에도 **소개노트는 열린다.** 그룹 후보도 1:1 후보와 같은 규칙으로 미리보기
       * 3문항(무작위 2 + one-word)이 온다 — BE 위키 Frontend-Candidate-Profile-Guide,
       * MatchAccessChecker.isMatchCandidate = isOneToOneCandidate || isGroupCandidate.
       * 서버가 이미 잘라서 주므로 FE 는 다시 자르지 않고 받은 순서대로 그린다.
       */
      cy.fixture("intro-notes-preview.json").then((data) => {
        cy.intercept("GET", "**/api/**/users/*/intro-notes", {
          statusCode: 200,
          body: { success: true, data },
        }).as("getMemberIntroNotePreview");
      });

      cy.contains("댕이누나").click();
      cy.wait("@getMemberIntroNotePreview");
      cy.get("[data-testid='intro-note-preview-item']").should("have.length", 3);
      cy.get("[data-testid='intro-note-preview-item']").last().should("contain", "Q10.");
      // 안내 문구는 성사 전에만 붙는다.
      cy.contains("대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요").should("be.visible");
    });
  });

  describe("참여 플로우", () => {
    it("참여 → 확인 모달 → (성사) 매칭 완료로 전환된다", () => {
      mockGroupWeek();
      openGroupModal();

      cy.contains("참여하기").click();
      cy.contains("이 그룹에 참여할까요?").should("be.visible");
      cy.contains("한 번 참여하기를 선택하면 취소할 수 없어요.").should("be.visible");
      cy.contains("네, 참여할게요").click();

      cy.wait("@acceptGroupMatch");
      cy.contains("그룹에 참여했어요! 대화는 금요일에 시작 돼요", { timeout: 6000 }).should("be.visible");
      cy.contains("매칭 완료").should("be.visible");
      cy.contains("만남이 이루어졌어요!").should("be.visible");
    });

    it("참여 → (수락자 3명 미만) 인원 대기 상태가 노출된다", () => {
      mockGroupWeek();
      // 수락은 됐지만 아직 성사 전 — isFormed:false
      cy.intercept("POST", "**/api/**/matches/group/*/accept", {
        statusCode: 200,
        body: {
          success: true,
          data: { groupMatchId: 5, quizSetId: 102, acceptedCount: 1, isFormed: false },
        },
      }).as("acceptGroupPending");

      openGroupModal();

      cy.contains("참여하기").click();
      cy.contains("네, 참여할게요").click();

      cy.wait("@acceptGroupPending");
      cy.contains("그룹 참여를 신청했어요. 3명 이상이 참여하면 금요일에 대화가 시작돼요.", { timeout: 6000 })
        .should("be.visible");
      cy.contains("그룹 참여를 신청했어요").should("be.visible");
      // 응답을 끝냈으므로 버튼이 잠긴다(좌측 거절하기 버튼은 dev 오버레이에 가려 검증하지 않는다).
      cy.contains("button", "참여하기").should("have.css", "cursor", "not-allowed");
    });

    it("이미 수락한 그룹으로 다시 들어오면 인원 대기 상태로 열린다", () => {
      // 서버가 myStatus: ACCEPTED, isFormed: false 를 주는 경우(새로고침·재진입)
      mockGroupWeek("matches-group-pending.json");
      openGroupModal();

      cy.contains("그룹 참여를 신청했어요").should("be.visible");
    });
  });

  describe("거절 플로우", () => {
    it("거절 → 확인 모달 → 다음 후보가 없으면 매칭 실패로 전환된다", () => {
      mockGroupWeek();
      openGroupModal();

      // 하단 좌측 버튼은 dev 전용 오버레이에 일부 가려질 수 있어 force 클릭
      cy.contains("거절하기").click({ force: true });
      cy.contains("그룹 참여를 거절할까요?").should("be.visible");
      cy.contains("거절하면 이번 주 그룹 대화에는 참여할 수 없습니다.").should("be.visible");
      cy.contains("네, 거절할게요").click();

      cy.wait("@declineGroupMatch");
      cy.contains("진행 중인 매칭이 없어요.", { timeout: 6000 }).should("be.visible");
    });

    it("거절하면 다음 후보 그룹을 추가 요청 없이 이어서 보여 준다", () => {
      // 서버는 후보를 최대 3개 내려주고 화면은 첫 번째만 그린다.
      mockGroupWeek("matches-group-two.json");
      openGroupModal();

      cy.contains("12개중 평균 8개 일치").should("be.visible");

      cy.contains("거절하기").click({ force: true });
      cy.contains("네, 거절할게요").click();
      cy.wait("@declineGroupMatch");

      // 홈 카드는 그대로 그룹 카드이고, 다시 열면 두 번째 후보가 보인다.
      cy.contains("대화 신청하기", { timeout: 6000 }).click();
      cy.contains("12개중 평균 6개 일치", { timeout: 6000 }).should("be.visible");
    });

    it("거절 모달에서 아니요를 누르면 모달만 닫힌다", () => {
      mockGroupWeek();
      openGroupModal();

      cy.contains("거절하기").click({ force: true });
      cy.contains("그룹 참여를 거절할까요?").should("be.visible");

      cy.contains("아니요").click();
      cy.contains("그룹 참여를 거절할까요?").should("not.exist");
      cy.contains("참여하기").should("be.visible");
    });
  });

  describe("다른 기기에서 먼저 응답한 경우", () => {
    it("이미 수락한 초대(5005)면 에러 대신 목록을 다시 받아 화면을 맞춘다", () => {
      mockGroupWeek();
      cy.intercept("POST", "**/api/**/matches/group/*/accept", {
        statusCode: 409,
        body: {
          success: false,
          data: null,
          error: { code: "5005", message: "이미 수락한 초대입니다.", statusCode: 409 },
        },
      }).as("acceptConflict");

      openGroupModal();

      // 첫 조회는 PENDING 으로 받았고, 재조회 시점에는 서버가 수락·성사된 상태를 준다.
      // 모달을 연 뒤에 덮어야 첫 로딩이 후보 카드로 뜬다.
      cy.fixture("matches-group-accepted.json").then((data) => {
        cy.intercept("GET", "**/api/**/matches/group", {
          statusCode: 200,
          body: { success: true, data },
        }).as("getGroupMatchesAfterConflict");
      });

      cy.contains("참여하기").click();
      cy.contains("네, 참여할게요").click();

      cy.wait("@acceptConflict");
      cy.contains("이미 응답한 그룹이에요. 최신 결과를 다시 불러올게요.", { timeout: 6000 }).should("be.visible");
      cy.wait("@getGroupMatchesAfterConflict");
      cy.contains("매칭 완료", { timeout: 6000 }).should("be.visible");
    });
  });
});
