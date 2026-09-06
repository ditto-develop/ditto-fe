import { defineConfig } from "cypress";

/**
 * 카카오 심사 제출용 화면 캡처 전용 설정.
 *
 * 기본 `cypress.config.ts` 는 `cypress/e2e/**` 만 본다(배포 게이트가 도는 범위).
 * 캡처 스펙은 테스트가 아니라 산출물 생성이라 그 범위 밖에 두고, 여기서만 실행한다.
 */
export default defineConfig({
  viewportWidth: 390,
  viewportHeight: 844,
  e2e: {
    baseUrl: "http://localhost:3100",
    specPattern: "cypress/capture/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    screenshotsFolder: "cypress/screenshots",
    video: false,
    retries: { runMode: 1, openMode: 0 },
    env: { mockApi: true },
  },
});
