import type { NextConfig } from "next";
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
});

const nextConfig = {
  compiler: {
    styledComponents: true, // 꼭 켜야 SSR 스타일 적용됨
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Cloudinary 등 외부 URL 허용
      },
    ],
  }
};


export default withPWA({nextConfig});

