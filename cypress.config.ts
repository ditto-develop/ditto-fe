import { defineConfig } from "cypress";

export default defineConfig({
  viewportWidth: 390,
  viewportHeight: 844,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    env: {
      mockApi: true,
    },
  },
});
