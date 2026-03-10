"use client";

import Splash from "@/components/splash/Splash";
import { useHomeReady } from "@/context/HomeReadyContext";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  console.log('[src/app/ClientLayout.tsx] ClientLayout'); // __component_log__
  const [splashDone, setSplashDone] = useState(false); // 비로그인 3초 타이머용
  const router = useRouter();
  const pathname = usePathname();
  const { isHomeReady } = useHomeReady();

  // 렌더 중 직접 읽기 — effect 안에서 setState 불필요 (lint 규칙 준수)
  // null = SSR 중 (window 미정의), true/false = 클라이언트
  const isLoggedIn = typeof window !== 'undefined'
    ? !!localStorage.getItem('accessToken')
    : null;

  useEffect(() => {
    if (!isLoggedIn) {
      // 비로그인: 3초 후 스플래시 숨김 (callback 안이라 setstate-in-effect 해당 없음)
      const timer = setTimeout(() => setSplashDone(true), 3000);
      return () => clearTimeout(timer);
    }
    // 로그인 상태: 루트·오어스 경로 → 홈으로 리다이렉트
    if (pathname === "/" || pathname.startsWith('/oauth')) {
      router.push("/home");
    }
  }, [isLoggedIn, pathname, router]);

  // showSplash를 state 없이 순수 파생값으로 계산
  const showSplash = (() => {
    if (isLoggedIn === null) return true;           // SSR / hydration 전
    if (!isLoggedIn) return !splashDone;            // 비로그인: 3초 타이머
    if (pathname === '/home') return !isHomeReady;  // 로그인 + 홈: 콘텐츠 준비까지
    return false;                                   // 로그인 + 다른 페이지
  })();

  const kakaoInit = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      console.log("Kakao SDK Initialized");
    }
  };

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        strategy="lazyOnload"
        onLoad={kakaoInit}
      />
      {/* children은 항상 마운트 — Splash가 오버레이로 덮음 */}
      {children}
      {showSplash && <Splash />}
    </>
  );
}
