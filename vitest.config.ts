import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// 경량 단위 테스트 설정.
// 컴포넌트/플로우 검증은 Cypress E2E(`npm run test:e2e:cypress`)와 Storybook이 담당하고,
// 이 설정은 DOM 이 필요 없는 순수 로직 단위 테스트를 node 환경에서 실행한다.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
