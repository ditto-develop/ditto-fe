const STORED_ACCESS_TOKEN =
  "eyJhbGciOiJub25lIn0.eyJzdWIiOiJsYW5kaW5nLXNlc3Npb24ifQ.signature";

describe("landing session redirect", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
  });

  it("redirects to /home when the stored session refreshes successfully", () => {
    cy.mockApi();

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("accessToken", STORED_ACCESS_TOKEN);
      },
    });

    cy.location("pathname", { timeout: 6000 }).should("match", /^\/home\/?$/);
  });

  /**
   * 콜드 스타트에서 "스플래시 → 로그인 화면 → 홈"으로 깜빡이던 회귀를 막는다.
   *
   * 루트 부팅 판정은 refresh → 계정 상태 확인 → replace("/home")의 비동기 체인이라,
   * 중간에 Splash가 걷히면 그 사이 루트(로그인 버튼) 화면이 그대로 노출됐다.
   * 계정 상태 확인 응답을 늦춰 그 구간을 관찰 가능하게 만들고, 그때도 스플래시가
   * 덮여 있는지 본다.
   */
  it("keeps the splash up from launch until /home", () => {
    cy.mockApi();

    const seen = { systemState: false };
    cy.intercept("GET", "**/api/v1/system/state", (req) => {
      seen.systemState = true;
      req.on("response", (res) => res.setDelay(700));
    }).as("systemStateDelayed");

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("accessToken", STORED_ACCESS_TOKEN);
      },
    });

    // 계정 상태 확인이 나간 시점 = refresh는 이미 끝났고 홈으로는 아직 못 간 구간.
    cy.wrap(seen).should("have.property", "systemState", true);
    cy.document().then((doc) => {
      expect(doc.location.pathname, "아직 루트에 있다").to.eq("/");
      expect(doc.querySelector(".splash-main"), "스플래시가 유지된다").to.not.be.null;
    });

    cy.location("pathname", { timeout: 8000 }).should("match", /^\/home\/?$/);
  });

  it("stays on landing and clears the stored access token when refresh fails", () => {
    cy.mockApi();
    cy.intercept("POST", "**/auth/refresh", (req) => {
      req.reply({
        statusCode: 401,
        headers: {
          "access-control-allow-origin": req.headers.origin ?? "*",
          "access-control-allow-credentials": "true",
        },
        body: {
          success: false,
          error: "Unauthorized",
        },
      });
    }).as("refreshTokenUnauthorized");

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("accessToken", STORED_ACCESS_TOKEN);
      },
    });

    cy.contains("퀴즈로 만나는 새로운 인연", { timeout: 6000 }).should("be.visible");
    cy.location("pathname").should("eq", "/");
    cy.window().should((win) => {
      expect(win.localStorage.getItem("accessToken")).to.eq(null);
    });
  });
});
