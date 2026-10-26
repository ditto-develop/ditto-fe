/**
 * 대화 기간 홈의 그룹 카드(프로필 묶음 → 프로필 선택 시트).
 *
 * 후보 그룹의 members 에는 구성원별 수락 상태가 없어, 거절한 사람까지 그룹 전원이 떴다
 * (QA 2026-10-26). 방이 열린 뒤에는 방의 counterpartMemberIds 로 걸러 방에 들어온 사람만 보인다.
 */
describe("대화 기간 홈 - 그룹 카드 멤버", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    // 성사된 그룹(ACCEPTED + isFormed). 구성원은 602 겜돌이 · 601 댕이누나 · 604 삼대천하 · 603 카페탐방러.
    cy.mockApi({ groupMatchesFixture: "matches-group-accepted.json" });
    cy.login();
  });

  /** 홈은 방 목록의 첫 방(가장 최근 방)을 쓴다. 그룹 방을 맨 앞에 두고 멤버를 바꾼다. */
  function mockGroupRoomWith(counterpartMemberIds: number[]) {
    cy.fixture("chat-rooms.json").then((rooms: Array<Record<string, unknown>>) => {
      const groupRoom = rooms.find((room) => room.sourceType === "GROUP");
      const others = rooms.filter((room) => room.sourceType !== "GROUP");
      cy.intercept("GET", "**/api/**/chat/rooms", {
        statusCode: 200,
        body: { success: true, data: [{ ...groupRoom, counterpartMemberIds }, ...others] },
      }).as("getGroupFirstRooms");
    });
  }

  it("프로필 선택에 방에 들어온 멤버만 보인다", () => {
    mockGroupRoomWith([602, 604]);
    cy.visit("/home");
    cy.wait("@getGroupFirstRooms");

    cy.contains("겜돌이님 외 1명", { timeout: 8000 }).should("be.visible");
    cy.get('[aria-label="그룹 멤버 프로필 보기"]').click();

    cy.contains("프로필 선택", { timeout: 6000 }).should("be.visible");
    cy.contains("삼대천하").should("be.visible");
    cy.contains("댕이누나").should("not.exist");
    cy.contains("카페탐방러").should("not.exist");
  });

  /** 최신 방이 다른 그룹의 방이면 겹치는 사람이 없다 — 카드를 비우지 않고 전원을 보인다. */
  it("방 멤버와 겹치는 사람이 없으면 그룹 전원을 보인다", () => {
    mockGroupRoomWith([2, 3, 4]);
    cy.visit("/home");
    cy.wait("@getGroupFirstRooms");

    cy.contains("겜돌이님 외 3명", { timeout: 8000 }).should("be.visible");
  });
});
