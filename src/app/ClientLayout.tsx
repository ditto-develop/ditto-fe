"use client";

import { Splash } from "@/components/splash/Splash";
import { useHomeReady } from "@/context/HomeReadyContext";
import { SanctionGate } from "@/features/sanction";
import { MswProvider } from "@/mocks/MswProvider";
import {
  ACCESS_TOKEN_KEY,
  clearTokens,
  hasValidSession,
} from "@/shared/lib/auth";
import { tryRefreshToken } from "@/shared/lib/api/client";
import { normalizePathname } from "@/shared/lib/routePath";
import { initAppShell } from "@/shared/lib/native/appShell";
import { initPushNotifications } from "@/shared/lib/native/pushNotifications";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [splashDone, setSplashDone] = useState(false); // 비로그인 3초 타이머용
  const [homeSplashExpired, setHomeSplashExpired] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const sessionVerified = useRef(false);
  const sessionVerifyInFlight = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isHomeReady } = useHomeReady();

  // trailingSlash: true 라 하드 로드면 "/home/", 클라이언트 내비게이션이면 "/home"이 들어온다.
  // 아래 판정은 전부 정규화한 경로 하나만 본다.
  const path = normalizePathname(pathname);

  // 로그인이 필요 없는 공개 경로
  const isAuthCallbackPath = path === "/auth/callback";
  // OAuth 콜백 경로(/oauth/*, /auth/callback)는 KakaoCallback이 로그인 후 라우팅을
  // 직접 결정한다(신규 회원=signupRequired → 회원가입 Tutorial 유지, 기존 회원 → /home).
  // ClientLayout이 "로그인 상태 + 공개 경로 → /home" 규칙으로 이 경로를 덮어쓰면
  // 회원가입 중인 신규 회원이 토큰 세팅 직후 /home으로 튕긴다. 라우팅 권한을 분리한다.
  const isOAuthFlowPath = path === '/oauth' || path.startsWith('/oauth/') || isAuthCallbackPath;
  // 제재 안내: OAuth 콜백으로 넘어온 제재 회원은 토큰이 아예 없으므로 공개 경로여야 한다.
  const isSanctionPath = path === '/sanction' || path.startsWith('/sanction/');
  const isPublicPath =
    path === "/" ||
    isOAuthFlowPath ||
    isSanctionPath ||
    path === '/localogin';
  // 관리자 경로: ClientLayout 리다이렉트/스플래시 완전 제외
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');

  // 만료된 임시 토큰(refresh 없는 access)을 제거하고 로그인 상태를 동기화한다.
  const syncAuthState = useCallback(() => {
    setIsLoggedIn(hasValidSession());
  }, []);

  useEffect(() => {
    setIsHydrated(true);
    syncAuthState();
  }, [path, syncAuthState]);

  // 네이티브 앱 셸(Capacitor) 초기화. 웹 브라우저에서는 전부 no-op이다.
  // Android 하드웨어 뒤로가기 · 상태바 · 딥링크만 담당한다.
  useEffect(() => {
    let dispose: (() => void) | undefined;
    initAppShell({ navigate: (target) => router.push(target) })
      .then((cleanup) => {
        dispose = cleanup;
      })
      .catch((err: unknown) => {
        console.error("[native] 앱 셸 초기화 실패:", err);
      });
    return () => dispose?.();
  }, [router]);

  // 푸시 알림은 로그인 이후에만 초기화한다. 디바이스 토큰 등록 API가 인증을
  // 요구하므로 비로그인 상태에서 부르면 401이 난다.
  useEffect(() => {
    if (!isLoggedIn) return;
    let dispose: (() => void) | undefined;
    initPushNotifications({ navigate: (target) => router.push(target) })
      .then((cleanup) => {
        dispose = cleanup;
      })
      .catch((err: unknown) => {
        console.error("[native] 푸시 초기화 실패:", err);
      });
    return () => dispose?.();
  }, [isLoggedIn, router]);

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

  // /home 진입 시 refresh로 세션 유효성 검증 (이미 검증한 세션은 건너뜀)
  useEffect(() => {
    if (!isHydrated || path !== "/home" || !isLoggedIn) return;
    if (sessionVerified.current || sessionVerifyInFlight.current) return;

    sessionVerifyInFlight.current = true;
    setIsVerifyingSession(true);
    tryRefreshToken().then((token) => {
      sessionVerifyInFlight.current = false;
      setIsVerifyingSession(false);
      if (token) {
        sessionVerified.current = true;
      } else {
        clearTokens();
        setIsLoggedIn(false);
        router.push("/");
      }
    });
  }, [isHydrated, path, isLoggedIn, router]);

  useEffect(() => {
    if (!isHydrated || path !== "/home" || !isLoggedIn) {
      setHomeSplashExpired(false);
      return;
    }

    const timer = setTimeout(() => setHomeSplashExpired(true), 2500);
    return () => clearTimeout(timer);
  }, [isHydrated, path, isLoggedIn]);

  useEffect(() => {
    if (!isHydrated || isAdminPath) return;
    // isLoggedIn state는 pathname 변경 시 별도 effect에서 동기화되어 이 렌더에서는
    // 아직 stale일 수 있다(예: 회원가입 중 토큰 세팅 후 보호 경로로 첫 진입).
    // stale 값으로 잘못 리다이렉트하지 않도록 세션을 즉시 재계산해서 사용한다.
    const loggedIn = hasValidSession();
    if (!loggedIn) {
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
    // 로그인 상태: 루트(/) → refresh 검증 성공 후 홈으로 리다이렉트.
    // OAuth 콜백 경로는 KakaoCallback이 라우팅을 담당하므로 제외하고,
    // /localogin도 제외한다.
    // 제재 화면은 토큰이 살아 있는 403(6006/6007) 진입도 있으므로 /home으로 되돌리지 않는다.
    const isHomeRedirectCandidate =
      isPublicPath &&
      !isOAuthFlowPath &&
      !isSanctionPath &&
      path !== '/localogin';

    if (!isHomeRedirectCandidate) return;

    if (sessionVerified.current) {
      router.push("/home");
      return;
    }

    if (sessionVerifyInFlight.current) return;

    sessionVerifyInFlight.current = true;
    setIsVerifyingSession(true);
    tryRefreshToken().then((token) => {
      sessionVerifyInFlight.current = false;
      setIsVerifyingSession(false);
      if (token) {
        sessionVerified.current = true;
        router.push("/home");
      } else {
        clearTokens();
        setIsLoggedIn(false);
      }
    });
  }, [
    isHydrated,
    isLoggedIn,
    isPublicPath,
    isOAuthFlowPath,
    isSanctionPath,
    isAdminPath,
    path,
    router,
  ]);

  // showSplash를 state 없이 순수 파생값으로 계산
  const showSplash = (() => {
    if (isAdminPath) return false;                  // 관리자 경로: 스플래시 없음
    if (!isHydrated) return true;                   // SSR / hydration 전
    if (isVerifyingSession) return true;            // refresh 검증 중
    // OAuth 콜백 경로는 KakaoCallback이 자체 로딩 UI를 렌더한다. 또한 토큰 세팅이
    // Suspense로 지연되면 isLoggedIn state가 stale(false)로 남아 Splash가 회원가입
    // 폼을 영구히 덮을 수 있으므로, 이 경로에서는 ClientLayout Splash를 띄우지 않는다.
    if (isOAuthFlowPath) return false;
    if (isSanctionPath) return false;               // 제재 안내: 자체 로딩 문구 사용
    if (!isLoggedIn) return !splashDone;            // 비로그인: 3초 타이머
    if (path === '/home') return isVerifyingSession || (!isHomeReady && !homeSplashExpired);
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
      <SanctionGate />
      {/* children은 항상 마운트 — Splash가 오버레이로 덮음 */}
      <MswProvider>{children}</MswProvider>
      {showSplash && <Splash />}
    </>
  );
}
