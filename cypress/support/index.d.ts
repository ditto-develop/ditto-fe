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
        memberReviewsFixture?: string;
        /** 진행 중 투표(group-votes.json 의 OPEN)의 필드를 덮어쓴다. */
        openVoteOverrides?: { createdBy?: number; votedCount?: number };
      }): Chainable<void>;
    }
  }
}
