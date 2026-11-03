/**
 * 테스터 모드 토글(src/shared/lib/featureFlags.ts). 홈 상단 로고를 7번 연달아 누르면 켜지고,
 * 다시 7번 누르면 꺼진다. 공개 전 기능은 이 모드가 켜진 기기에서만 보인다.
 */
const KEY = "ditto.testerMode";

function tapLogo(times: number) {
  for (let index = 0; index < times; index += 1) {
    cy.get('[data-testid="home-logo"]').click();
  }
}

describe("tester mode", () => {
  beforeEach(() => {
    cy.mockApi();
    cy.login();
  });

  it("로고를 7번 누르면 켜지고, 다시 7번 누르면 꺼진다", () => {
    cy.visit("/home");
    cy.get('[data-testid="home-logo"]', { timeout: 8000 }).should("be.visible");

    // 6번까지는 아무 일도 없다.
    tapLogo(6);
    cy.contains("테스터 모드를 켰어요.").should("not.exist");
    cy.window().its("localStorage").invoke("getItem", KEY).should("be.null");

    tapLogo(1);
    cy.contains("테스터 모드를 켰어요.").should("be.visible");
    cy.window().its("localStorage").invoke("getItem", KEY).should("eq", "on");

    // 토스트는 하나만 뜬다 — 떠 있는 동안 새 토스트는 무시된다(ToastContext). 사라진 뒤에 끈다.
    cy.contains("테스터 모드를 켰어요.", { timeout: 8000 }).should("not.exist");
    tapLogo(7);
    cy.contains("테스터 모드를 껐어요.").should("be.visible");
    cy.window().its("localStorage").invoke("getItem", KEY).should("be.null");
  });

  it("cy.enableTesterMode 로 켜 두면 새로고침 뒤에도 켜져 있다", () => {
    cy.enableTesterMode();
    cy.visit("/home");
    cy.get('[data-testid="home-logo"]', { timeout: 8000 }).should("be.visible");

    // 이미 켜져 있으므로 7번 누르면 꺼진다.
    tapLogo(7);
    cy.contains("테스터 모드를 껐어요.").should("be.visible");
  });
});
