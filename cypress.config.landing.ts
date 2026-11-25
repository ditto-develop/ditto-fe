import { defineConfig } from "cypress";

import captureConfig from "./cypress.config.capture";

/**
 * 웹 다운로드 안내(/download)에 넣는 앱 화면 캡처. 393×798 pt × 2배 — iPhone 15(393×852)에서
 * 상태 표시줄(54 pt)을 뺀 앱 영역이다. 상태 표시줄과 폰 테두리는 scripts/build-landing-shots.mjs 가 그린다.
 *
 * 캡처 설정(cypress.config.capture.ts)을 그대로 쓰고 뷰포트·픽셀 배율·스펙만 바꾼다.
 * 픽셀 배율은 브라우저 실행 인자라서 Chrome 으로 돌린다(`--browser chrome`).
 * 창이 뷰포트보다 작으면 Cypress 가 화면을 축소해 찍으므로 창도 넉넉히 키운다.
 */
export default defineConfig({
  ...captureConfig,
  viewportWidth: 393,
  viewportHeight: 798,
  e2e: {
    ...captureConfig.e2e,
    specPattern: "cypress/capture/web-landing.cy.ts",
    setupNodeEvents(on) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.name === "chrome") {
          launchOptions.args.push("--force-device-scale-factor=2", "--window-size=1400,1400");
        }
        return launchOptions;
      });
    },
  },
});
