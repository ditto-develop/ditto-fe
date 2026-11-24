/**
 * Figma "3.1 매칭 & 프로필" — 3.1 매칭 결과 그룹 매칭 (WF-07)
 * node-id 673-12674
 *
 * 계약 정본: BE 위키 `Frontend-Group-Matching-Guide`.
 * 그룹 매칭은 선착순 방 배정이 아니라 **미리 짜인 후보 그룹에 응답**하는 흐름이다.
 * 초대의 기본값은 참여다 — 금 00:00 마감까지 거절하지 않으면 서버가 참여로 바꾼다(ditto-server #397).
 * 그래서 응답 버튼은 "거절하기"뿐이다. 화면 상태는 전부 `GET /matches/group` 의 `groups[0]`에서 나온다.
 *
 * - 그룹 결과 모달(서버가 계산한 평균 일치, 그룹 카드, 멤버 정보, 자동 참여 안내)
 * - 프로필 선택 → 멤버 상세(후보 목록 카드 + 소개노트 미리보기 3문항)
 * - 예전 앱에서 이미 수락한 그룹 → 인원 대기(CTA 없음)
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
      // 응답 버튼은 거절하기뿐이고, 거절하지 않으면 마감에 참여로 처리된다는 안내가 붙는다(#397).
      cy.contains("button", "거절하기").should("be.visible");
      cy.contains("거절하지 않으면 금요일 00:00에 자동으로 참여돼요.").should("be.visible");
      cy.contains("button", "참여하기").should("not.exist");
    });
  });

  describe("그룹 이름", () => {
    // 그룹 채팅방 이름(서버 roomName)과 같은 값을 쓰도록 퀴즈셋 title 로 짓는다.
    it("그룹 퀴즈셋의 제목으로 그룹 이름을 짓는다", () => {
      mockGroupWeek();
      // 그룹 후보의 quizSetId(102)와 같은 GROUP 세트를 이번 주 퀴즈셋에 싣는다.
      cy.fixture("quiz-current.json").then((data) => {
        const [oneToOne] = data.quizSets;
        cy.intercept("GET", "**/api/v1/quiz-sets/current-week", {
          statusCode: 200,
          body: {
            success: true,
            data: {
              ...data,
              quizSets: [
                oneToOne,
                {
                  ...oneToOne,
                  id: "102",
                  title: "여행, 음식",
                  category: "쓰이지 않는 카테고리",
                  matchingType: "GROUP",
                },
              ],
            },
          },
        });
      });

      openGroupModal();
      cy.contains("같은 여행, 음식 그룹").should("be.visible");
      cy.contains("같은 취미, 취향 그룹").should("not.exist");
      cy.contains("쓰이지 않는 카테고리").should("not.exist");
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

  /**
   * 이 화면에는 수락 버튼이 없지만, 서버는 예전 앱을 위해 수락 API 를 남겨 두었다(#397).
   * 그래서 매칭 기간에도 `ACCEPTED` 가 올 수 있다.
   */
  describe("예전 앱에서 이미 수락한 그룹", () => {
    it("인원 대기 상태로 열리고 응답 버튼·자동 참여 안내가 없다", () => {
      // 서버가 myStatus: ACCEPTED, isFormed: false 를 주는 경우
      mockGroupWeek("matches-group-pending.json");
      openGroupModal();

      cy.contains("그룹 참여를 신청했어요").should("be.visible");
      cy.contains("button", "참여하기").should("not.exist");
      cy.contains("button", "거절하기").should("not.exist");
      cy.contains("거절하지 않으면 금요일 00:00에 자동으로 참여돼요.").should("not.exist");
    });

    // 수락한 뒤에도 같이 매칭된 사람들을 볼 수 있어야 한다(2026-11-19 QA "수락 후 멤버 리스트를 볼 수 없음").
    it("수락한 뒤에도 그룹 카드를 눌러 멤버 목록을 볼 수 있다", () => {
      mockGroupWeek("matches-group-pending.json");
      openGroupModal();

      cy.contains("그룹 참여를 신청했어요").should("be.visible");
      cy.contains("같은 취미, 취향 그룹").click();
      cy.contains("프로필 선택", { timeout: 6000 }).should("be.visible");
      cy.contains("댕이누나").should("be.visible");
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
      cy.contains("button", "거절하기").should("be.visible");
    });
  });

  describe("다른 기기에서 먼저 응답한 경우", () => {
    it("거절했는데 이미 수락한 초대(5005)면 에러 대신 목록을 다시 받아 화면을 맞춘다", () => {
      // 예전 앱이 깔린 다른 기기에서 먼저 수락한 경우다.
      mockGroupWeek();
      cy.intercept("POST", "**/api/**/matches/group/*/decline", {
        statusCode: 409,
        body: {
          success: false,
          data: null,
          error: { code: "5005", message: "이미 수락한 초대입니다.", statusCode: 409 },
        },
      }).as("declineConflict");

      openGroupModal();

      // 첫 조회는 PENDING 으로 받았고, 재조회 시점에는 서버가 수락·성사된 상태를 준다.
      // 모달을 연 뒤에 덮어야 첫 로딩이 후보 카드로 뜬다.
      cy.fixture("matches-group-accepted.json").then((data) => {
        cy.intercept("GET", "**/api/**/matches/group", {
          statusCode: 200,
          body: { success: true, data },
        }).as("getGroupMatchesAfterConflict");
      });

      cy.contains("거절하기").click({ force: true });
      cy.contains("네, 거절할게요").click();

      cy.wait("@declineConflict");
      cy.contains("이미 응답한 그룹이에요. 최신 결과를 다시 불러올게요.", { timeout: 6000 }).should("be.visible");
      cy.wait("@getGroupMatchesAfterConflict");
      cy.contains("매칭 완료", { timeout: 6000 }).should("be.visible");
    });
  });
});
