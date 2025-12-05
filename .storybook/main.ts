import type { StorybookConfig } from '@storybook/react-vite'; // 또는 현재 쓰는 framework 그대로 둬도 됨

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    // 쓰고 있는 addon 그대로 두면 됨
  ],
  framework: {
    name: '@storybook/react-vite', // 또는 '@storybook/react-webpack5' 등, 원래 값 유지
    options: {},
  },
  // 나머지 설정들 있으면 그대로 두면 됨
};

export default config;
