/**
 * 평가 폼을 그릴 수 없는 상태에서도 빠져나갈 수 있어야 한다.
 *
 * 평가 화면은 푸시·알림 센터 딥링크와 방 종료(replace)로 바로 들어와 돌아갈 이전 화면이 없을 수
 * 있다. 이미 완료한 평가의 알림을 다시 누르면 목록(미완료만 담김)에 평가가 없어 "완료했거나 아직
 * 열리지 않은 평가"가 뜨는데, 여기서 닫기로 대화방 목록에 갈 수 있어야 한다.
 */
describe("rating state screen", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("1:1 — 열린 평가가 없으면 안내와 함께 닫기로 목록에 간다", () => {
    // 목업 평가는 chatRoomId 1(PERSONAL)·2(GROUP)뿐이다.
    cy.visit("/chat/one-on-one/99/rate");
    cy.wait("@getMemberReviews");

    cy.contains("완료했거나 아직 열리지 않은 평가예요.", { timeout: 8000 }).should("be.visible");
    cy.get('img[alt="close"]').click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/chat\/?$/);
  });

  it("그룹 — 열린 평가가 없으면 안내와 함께 닫기로 목록에 간다", () => {
    cy.visit("/chat/group/99/rate");
    cy.wait("@getMemberReviews");

    cy.contains("완료했거나 아직 열리지 않은 평가예요.", { timeout: 8000 }).should("be.visible");
    cy.get('img[alt="close"]').click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/chat\/?$/);
  });
});
