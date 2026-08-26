/**
 * 홈은 스크롤 없이 한 화면에 들어가야 한다.
 *
 * 브라우저는 env(safe-area-inset-*)를 흉내 낼 수 없으므로 뷰포트 넘침을 직접 재지 않고,
 * **본문 흐름 높이에 상한을 건다.** 앱(네이티브 셸)에서는 상태바 + 홈 인디케이터 인셋이
 * 여기에 더해지는데, 다이나믹 아일랜드 기준으로 위 59px + 아래 34px = 약 93px이다.
 * 844px 기기에서 그만큼을 빼면 본문이 쓸 수 있는 예산이 약 750px이 된다.
 *
 * 이 상한을 넘기면 앱에서 홈에 스크롤이 생긴다.
 */
const FLOW_HEIGHT_BUDGET = 750;

describe("home fits one screen", () => {
  (["QUIZ", "MATCHING", "CHATTING"] as const).forEach((period) => {
    it(`stays within the budget during ${period}`, () => {
      cy.clockPeriod(period);
      cy.mockApi();
      cy.login();
      cy.visit("/home");

      // 카드가 다 그려진 뒤에 잰다. 스플래시는 2.5초에 걷힌다.
      cy.contains("타임라인", { timeout: 10000 }).should("be.visible");

      cy.document().then((doc) => {
        const main = doc.querySelector('[class*="MainContainer"]');
        expect(main, "홈 컨테이너").to.exist;

        // 하단 탭은 position: fixed라 흐름 높이에 포함되지 않는다.
        const flowHeight = Array.from(main!.children)
          .filter((child) => getComputedStyle(child).position !== "fixed")
          .reduce((total, child) => total + child.getBoundingClientRect().height, 0);

        expect(Math.round(flowHeight), `${period} 본문 흐름 높이`).to.be.at.most(FLOW_HEIGHT_BUDGET);
      });
    });
  });
});
