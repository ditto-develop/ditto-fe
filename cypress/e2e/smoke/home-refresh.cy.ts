/**
 * 홈은 폴링하지 않는다(2026-10-04). 당겨서 새로고침하거나 앱으로 돌아올 때만 다시 읽는다.
 */
function pull(fromY: number, toY: number) {
  const touch = (clientY: number) => ({ touches: [{ clientX: 200, clientY }] });
  cy.document().trigger("touchstart", touch(fromY));
  cy.document().trigger("touchmove", touch(fromY + 10));
  cy.document().trigger("touchmove", touch(toY));
  cy.document().trigger("touchend", { touches: [] });
}

describe("home refresh", () => {
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.mockApi();
    // 응답은 mockApi 가 준다. 여기서는 홈 로딩 횟수만 센다(라이브 경로 /api/v1 만).
    cy.intercept("GET", "**/api/v1/system/state").as("homeLoad");
    cy.login();
    cy.visit("/home");
    cy.contains("타임라인", { timeout: 10000 }).should("be.visible");
    cy.get('[data-cy="home-card-skeleton"]', { timeout: 10000 }).should("not.exist");
  });

  it("does not poll while the screen stays open", () => {
    cy.get("@homeLoad.all").then((initial) => {
      expect(initial.length, "첫 로딩").to.be.greaterThan(0);
      // 예전 매칭 기간 폴링 주기(4초)를 넉넉히 넘겨도 다시 부르지 않는다.
      cy.wait(5000);
      cy.get("@homeLoad.all").should("have.length", initial.length);
    });
  });

  it("reloads when pulled down from the top", () => {
    cy.get("@homeLoad.all").then((initial) => {
      pull(120, 400);
      cy.get("@homeLoad.all").should("have.length.greaterThan", initial.length);
    });
  });

  it("does not reload on a short pull", () => {
    cy.get("@homeLoad.all").then((initial) => {
      pull(120, 160);
      cy.wait(500);
      cy.get("@homeLoad.all").should("have.length", initial.length);
    });
  });

  it("reloads when the screen becomes visible again", () => {
    cy.get("@homeLoad.all").then((initial) => {
      cy.document().trigger("visibilitychange");
      cy.get("@homeLoad.all").should("have.length.greaterThan", initial.length);
    });
  });
});
