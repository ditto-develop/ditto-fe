export {};

declare global {
  namespace Cypress {
    interface Chainable {
      clockPeriod(period: "QUIZ" | "MATCHING" | "CHATTING"): Chainable<void>;
      login(options?: {
        accessToken?: string;
        refreshToken?: string;
      }): Chainable<void>;
      mockApi(options?: {
        matchesFixture?: string;
        matchingStatusFixture?: string;
      }): Chainable<void>;
    }
  }
}
