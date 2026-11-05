/** @type {import('next').NextConfig} */

const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  // 개발 서버 왼쪽 아래 'N' 표시가 하단 탭(4개일 때 홈 탭)을 덮어 Cypress 클릭이 막힌다. 운영 빌드에는 없다.
  devIndicators: false,
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
