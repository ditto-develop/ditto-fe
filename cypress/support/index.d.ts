export {};

declare global {
  namespace Cypress {
    interface Chainable {
      clockPeriod(period: "QUIZ" | "MATCHING" | "CHATTING"): Chainable<void>;
      login(options?: {
        accessToken?: string;
        refreshToken?: string;
      }): Chainable<void>;
      /** 공개 전 기능이 보이도록 테스터 모드를 켠다. cy.visit 전에 부른다. */
      enableTesterMode(): Chainable<void>;
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
