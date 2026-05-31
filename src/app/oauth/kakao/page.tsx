"use client";

import { KakaoCallback } from "@/components/auth/KakaoCallback";

// 레거시 콜백 경로. BE/카카오 콘솔 redirect_uri가 /auth/callback 으로 완전히
// 전환되면 이 라우트를 제거한다. 그 전까지 두 경로 모두 콜백을 처리한다.
export default function KakaoRedirectPage() {
  return <KakaoCallback />;
}
