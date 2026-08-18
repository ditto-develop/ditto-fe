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
