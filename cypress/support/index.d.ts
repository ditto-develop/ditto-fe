export {};

declare global {
  namespace Cypress {
    interface Chainable {
      clockPeriod(period: "QUIZ" | "MATCHING" | "CHATTING"): Chainable<void>;
      login(options?: {
        accessToken?: string;
        refreshToken?: string;
      }): Chainable<void>;
      /** 테스터 모드를 켠다 — 서버 플래그가 꺼진 기능도 보인다. cy.visit 전에 부른다. */
      enableTesterMode(): Chainable<void>;
      /**
       * 서버 기능 플래그 응답을 덮어쓴다. 적지 않은 키는 켜짐이다(cy.mockApi 기본값).
       * cy.mockApi 뒤, cy.visit 전에 부른다.
       */
      mockFeatureFlags(overrides: Record<string, boolean>): Chainable<void>;
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
