// 그룹 만남 투표(BE 위키 Frontend-Vote-Guide).
//
// 투표는 별도 STOMP destination이 없고 방 토픽의 SYSTEM 메시지(`VOTE_CREATED:{id}`)로만
// 신호가 온다. 화면 복구의 기준은 `GET /chat/rooms/{id}/votes`이므로, 여기서도 목록 REST가
// 돌려주는 상태만으로 배너·카드·제출·결과가 전부 그려지는지 확인한다.
//
// 투표 '생성' 플로우는 카카오 지도 SDK의 장소 검색에 의존해 E2E로 고정할 수 없다.
// 생성 진입점의 노출/숨김 규칙만 여기서 검증한다.
const SUBMISSION = '[aria-labelledby="vote-submission-title"]';
const RESULTS = '[aria-label="투표 결과"]';

/** 배너의 '투표하기' 버튼으로 제출 화면을 연다(아직 한 표도 안 던진 상태). */
function openSubmission() {
  cy.contains("만남 투표 진행 중", { timeout: 8000 }).should("be.visible");
  cy.contains("button", "투표하기").click();
  cy.get(SUBMISSION, { timeout: 8000 }).should("be.visible");
}

describe("group meeting vote", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("shows the open-vote banner and the created-vote card", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getChatRooms");
    cy.wait("@getRoomVotes");

    cy.contains("만남 투표 진행 중", { timeout: 8000 }).should("be.visible");
    // VOTE_CREATED SYSTEM 메시지는 평문이 아니라 카드로 그려진다.
    cy.contains("만남 투표가 열렸어요!").should("be.visible");
    cy.contains("강남역 스타벅스 외 1개").should("be.visible");
  });

  it("hides the create entry point while a vote is open", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getRoomVotes");

    cy.contains("만남 투표 진행 중", { timeout: 8000 }).should("be.visible");
    cy.get('img[alt="더보기"]').click();
    cy.contains("멤버 목록").should("be.visible");
    // 방당 열린 투표는 하나뿐이다 — 그대로 만들면 서버가 8202로 거절한다.
    cy.contains("투표 만들기").should("not.exist");
  });

  it("casts a vote and lands on the results screen", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getRoomVotes");

    openSubmission();

    // 방 화면(배너·카드)도 같은 문구를 갖고 있어 반드시 다이얼로그 안으로 좁혀서 조작한다.
    cy.get(SUBMISSION).within(() => {
      // 시간 선택지는 서버가 meetAt만 주고 표시 문구는 FE가 만든다.
      cy.contains("6월 13일 토요일 오후 7시").should("be.visible");

      cy.contains("홍대 카페거리").click();
      cy.contains("6월 13일 토요일 오후 7시").click();
      cy.contains("button", "투표하기").click();
    });

    cy.wait("@castVote").its("request.body").should("deep.equal", {
      placeIds: [302],
      timeIds: [311],
    });

    // 제출 직후 결과 화면으로 이어진다. 내 표가 반영돼 3/4가 된다.
    cy.get(RESULTS, { timeout: 8000 }).within(() => {
      cy.contains("3/4 투표").should("be.visible");
      cy.contains("강남역 스타벅스").should("be.visible");
    });
  });

  it("closes the vote from the results screen", () => {
    cy.visit("/chat/group/3");
    cy.wait("@getRoomVotes");

    openSubmission();
    cy.get(SUBMISSION).within(() => {
      cy.contains("홍대 카페거리").click();
      cy.contains("6월 13일 토요일 오후 7시").click();
      cy.contains("button", "투표하기").click();
    });
    cy.wait("@castVote");

    // 마감은 방 멤버 누구나 할 수 있고 멱등이다.
    cy.get(RESULTS, { timeout: 8000 }).contains("button", "투표 마감하기").click();
    cy.wait("@closeVote");

    // 마감되면 진행 중 액션이 사라진다.
    cy.get(RESULTS).within(() => {
      cy.contains("button", "투표 마감하기").should("not.exist");
      cy.contains("button", "다시 투표하기").should("not.exist");
    });
  });
});
