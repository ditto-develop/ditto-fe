"use client";

import { Splash } from "@/components/splash/Splash";
import { useHomeReady } from "@/context/HomeReadyContext";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  console.log('[src/app/ClientLayout.tsx] ClientLayout'); // __component_log__
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [splashDone, setSplashDone] = useState(false); // 비로그인 3초 타이머용
  const [homeSplashExpired, setHomeSplashExpired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isHomeReady } = useHomeReady();

  // 로그인이 필요 없는 공개 경로
  const isPublicPath = pathname === "/" || pathname.startsWith('/oauth') || pathname === '/localogin' || pathname === '/localogin/';
  // 관리자 경로: ClientLayout 리다이렉트/스플래시 완전 제외
  const isAdminPath = pathname.startsWith('/admin');

  useEffect(() => {
    setIsHydrated(true);
    setIsLoggedIn(!!localStorage.getItem("accessToken"));
  }, [pathname]);

  useEffect(() => {
    if (!isHydrated || pathname !== "/home" || !isLoggedIn) {
      setHomeSplashExpired(false);
      return;
    }

    const timer = setTimeout(() => setHomeSplashExpired(true), 2500);
    return () => clearTimeout(timer);
  }, [isHydrated, pathname, isLoggedIn]);

  useEffect(() => {
    if (!isHydrated || isAdminPath) return;
    if (!isLoggedIn) {
      if (isPublicPath) {
        // 비로그인 + 공개 경로: 3초 후 스플래시 숨김
        const timer = setTimeout(() => setSplashDone(true), 3000);
        return () => clearTimeout(timer);
      } else {
        // 비로그인 + 보호 경로: 로그인 페이지로 리다이렉트
        router.push("/");
      }
      return;
    }
    // 로그인 상태: 루트·오어스 경로 → 홈으로 리다이렉트 (/localogin 제외)
    if (isPublicPath && pathname !== '/localogin' && pathname !== '/localogin/') {
      router.push("/home");
    }
  }, [isHydrated, isLoggedIn, isPublicPath, isAdminPath, pathname, router]);

  // showSplash를 state 없이 순수 파생값으로 계산
  const showSplash = (() => {
    if (isAdminPath) return false;                  // 관리자 경로: 스플래시 없음
    if (!isHydrated) return true;                   // SSR / hydration 전
    if (!isLoggedIn) return !splashDone;            // 비로그인: 3초 타이머
    if (pathname === '/home') return !isHomeReady && !homeSplashExpired;
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
