import type { NextConfig } from "next";
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
});

const nextConfig = {
  compiler: {
    styledComponents: true, // 꼭 켜야 SSR 스타일 적용됨
  },
};


export default withPWA({nextConfig});

