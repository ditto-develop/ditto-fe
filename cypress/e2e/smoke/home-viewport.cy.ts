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

/**
 * 앱 안에서 홈으로 다시 들어올 때 Splash가 다시 뜨면 화면이 한 번 깜빡인다.
 * (`isHomeReady`를 MainSection이 마운트마다 false로 되돌리기 때문)
 * 최초 로드 이후에는 홈 자체 스켈레톤이 그 자리를 받아야 한다.
 */
describe("no splash flash on in-app navigation", () => {
  it("does not re-show the splash when returning to home", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    cy.visit("/home");
    cy.contains("타임라인", { timeout: 10000 }).should("be.visible");
    cy.wait(3000);

    cy.contains("a", "프로필").click();
    cy.location("pathname", { timeout: 8000 }).should("include", "/profile");
    cy.wait(1500);

    // 홈으로 돌아가는 동안 Splash가 한 프레임이라도 뜨는지 감시한다.
    const seen = { frames: 0 };
    cy.window().then((win) => {
      const timer = win.setInterval(() => {
        if (win.document.querySelector(".splash-main")) seen.frames += 1;
      }, 16);
      win.setTimeout(() => win.clearInterval(timer), 6000);
    });

    cy.contains("a", "홈").click();
    cy.location("pathname", { timeout: 8000 }).should("include", "/home");
    cy.wait(2500);

    cy.then(() => {
      expect(seen.frames, "홈 복귀 중 Splash가 뜬 프레임 수").to.equal(0);
    });
  });
});
