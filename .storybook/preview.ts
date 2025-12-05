import type { Preview } from '@storybook/nextjs-vite'
import "../src/app/styles/token/atomic.css"; // 경로는 프로젝트 구조에 맞게 수정
import "../src/app/styles/token/semantic.css"; // ← 지금 올린 시멘틱 토큰 파일

const preview: Preview = {
  
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;