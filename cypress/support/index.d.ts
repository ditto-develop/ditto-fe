export {};

declare global {
  namespace Cypress {
    interface Chainable {
      login(options?: {
        accessToken?: string;
        refreshToken?: string;
      }): Chainable<void>;
      mockApi(): Chainable<void>;
    }
  }
}
