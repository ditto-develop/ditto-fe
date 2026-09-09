/**
 * OS 수준 뒤로가기 (Android 하드웨어 버튼 · iOS 스와이프 백).
 *
 * 앱에서 뒤로가기가 전혀 동작하지 않던 원인은 두 개였다:
 *  1. iOS 웹뷰의 스와이프 제스처가 꺼져 있었다 — 네이티브 설정이라 E2E 로 덮을 수 없다
 *     (`ios/App/App/SceneDelegate.swift` 의 `MainViewController`).
 *  2. 히스토리가 스스로 되감겼다 — 가드 리다이렉트와 화면 안 뒤로 버튼이 `push` 였다.
 *     **이 스펙이 검증하는 부류**이고, 브라우저에서 그대로 재현된다. `cy.go("back")` 은
 *     앱에서 OS 뒤로가기가 소비하는 것과 같은 히스토리를 쓴다.
 *
 * 모달·바텀시트를 뒤로가기로 닫는 처리는 여기서 검증하지 않는다. 히스토리가 아니라
 * Capacitor 의 `backButton` 이벤트를 가로채는 방식이라(이유는
 * `src/shared/lib/overlayStack.ts` 주석) 네이티브 셸 밖에서는 발생하지 않는 경로다.
 * 대신 `src/shared/lib/overlayStack.test.ts` 와 `appShell.test.ts` 가 단위로 덮는다.
 */
describe("뒤로가기", () => {
  it("매칭 화면의 뒤로 버튼은 히스토리를 소비한다 (쌓지 않는다)", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
    cy.login();

    cy.visit("/home");
    cy.contains("결과 확인", { timeout: 6000 }).click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/matching\/?$/);

    cy.get('img[alt="back"]').click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);

    // 뒤로 버튼이 `push("/home")` 이면 앞으로 갈 곳이 없어 /home 에 머문다.
    // 히스토리를 소비했다면 방금 떠난 /matching 이 forward 로 남아 있다.
    cy.go("forward");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/matching\/?$/);
  });

  it("바텀시트를 여닫아도 화면 히스토리가 늘지 않는다", () => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();

    cy.visit("/chat/one-on-one/1");
    cy.contains("수민", { timeout: 8000 }).should("be.visible");

    cy.window()
      .its("history.length")
      .then((baseline: number) => {
        cy.get('[data-cy="chat-menu-button"]').click();
        cy.contains("대화방 나가기").should("be.visible");

        // 시트를 오버레이 클릭으로 닫는다.
        cy.get("body").click(5, 5);
        cy.contains("대화방 나가기").should("not.exist");

        // 오버레이가 히스토리 엔트리를 쌓으면 이 시트를 닫은 뒤 누른 뒤로가기가
        // 아무 일도 하지 않는 것처럼 보인다. 히스토리는 그대로여야 한다.
        cy.window().its("history.length").should("eq", baseline);
      });

    // 그리고 뒤로가기는 화면 이동으로 그대로 동작해야 한다.
    cy.go("back");
    cy.location("pathname", { timeout: 6000 }).should("not.match", /^\/chat\/one-on-one\/1\/?$/);
  });

  it("로그인 세션으로 루트에 들어가면 홈 리다이렉트가 히스토리를 쌓지 않는다", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();

    // 기준값: 리다이렉트 없이 홈에 바로 들어간 상태.
    cy.visit("/home");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);

    cy.window()
      .its("history.length")
      .then((baseline: number) => {
        // 루트 진입(문서 로드) 1칸 + 가드 리다이렉트. 리다이렉트가 replace 면 +1,
        // push 면 +2 다. push 였을 때가 바로 홈에서 뒤로가기가 먹지 않던 상태다.
        cy.visit("/");
        cy.location("pathname", { timeout: 8000 }).should("match", /^\/home\/?$/);
        cy.window().its("history.length").should("eq", baseline + 1);
      });
  });
});
