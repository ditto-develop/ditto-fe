import { defineConfig } from "cypress";

import captureConfig from "./cypress.config.capture";

/**
 * App Store 스크린샷 전용 설정. iPhone 6.9" 규격 1320×2868 = 440×956 pt × 3배.
 *
 * 캡처 설정(cypress.config.capture.ts)을 그대로 쓰고 뷰포트·픽셀 배율·스펙만 바꾼다.
 * 픽셀 배율은 브라우저 실행 인자라서 Chrome 으로 돌린다(`--browser chrome`).
 * 창이 뷰포트보다 작으면 Cypress 가 화면을 축소해 찍으므로 창도 넉넉히 키운다.
 */
export default defineConfig({
  ...captureConfig,
  viewportWidth: 440,
  viewportHeight: 956,
  e2e: {
    ...captureConfig.e2e,
    specPattern: "cypress/capture/app-store.cy.ts",
    setupNodeEvents(on) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.name === "chrome") {
          launchOptions.args.push("--force-device-scale-factor=3", "--window-size=1400,1400");
        }
        return launchOptions;
      });
    },
  },
});
