"use client";

import { Splash } from "@/components/splash/Splash";
import { useHomeReady } from "@/context/HomeReadyContext";
import { MswProvider } from "@/mocks/MswProvider";
import {
  ACCESS_TOKEN_KEY,
  clearTokens,
  hasValidSession,
} from "@/shared/lib/auth";
import { tryRefreshToken } from "@/shared/lib/api/client";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [splashDone, setSplashDone] = useState(false); // 비로그인 3초 타이머용
  const [homeSplashExpired, setHomeSplashExpired] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const verifiedPaths = useRef(new Set<string>());
  const router = useRouter();
  const pathname = usePathname();
  const { isHomeReady } = useHomeReady();

  // 로그인이 필요 없는 공개 경로
  const isAuthCallbackPath = pathname === "/auth/callback" || pathname === "/auth/callback/";
  const isPublicPath = pathname === "/" || pathname.startsWith('/oauth') || isAuthCallbackPath || pathname === '/localogin' || pathname === '/localogin/';
  // 관리자 경로: ClientLayout 리다이렉트/스플래시 완전 제외
  const isAdminPath = pathname.startsWith('/admin');

  // 만료된 임시 토큰(refresh 없는 access)을 제거하고 로그인 상태를 동기화한다.
  const syncAuthState = useCallback(() => {
    setIsLoggedIn(hasValidSession());
  }, []);

  useEffect(() => {
    setIsHydrated(true);
    syncAuthState();
  }, [pathname, syncAuthState]);

  // 쓰레기 토큰 감시: 주기적 + 탭 간 storage 변경 시 제거·동기화
  useEffect(() => {
    if (!isHydrated) return;
    const interval = setInterval(syncAuthState, 30_000);
    const onStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY) {
        syncAuthState();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [isHydrated, syncAuthState]);

  // /home 진입 시 refresh로 세션 유효성 검증 (이미 검증한 경로는 건너뜀)
  useEffect(() => {
    if (!isHydrated || pathname !== "/home" || !isLoggedIn) return;
    if (verifiedPaths.current.has(pathname)) return;

    setIsVerifyingSession(true);
    tryRefreshToken().then((token) => {
      if (token) {
        verifiedPaths.current.add(pathname);
      } else {
        clearTokens();
        setIsLoggedIn(false);
        router.push("/");
      }
      setIsVerifyingSession(false);
    });
  }, [isHydrated, pathname, isLoggedIn, router]);

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
    if (pathname === '/home') return isVerifyingSession || (!isHomeReady && !homeSplashExpired);
    return false;                                   // 로그인 + 다른 페이지
  })();

  const kakaoInit = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
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
      <MswProvider>{children}</MswProvider>
      {showSplash && <Splash />}
    </>
  );
}
