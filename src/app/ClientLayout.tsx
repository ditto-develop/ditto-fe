"use client";

import { Splash } from "@/components/splash/Splash";
import { DebugOverlay } from "@/components/debug/DebugOverlay";
import { useHomeReady } from "@/context/HomeReadyContext";
import { SanctionGate } from "@/features/sanction";
import { SignupIncompleteGate } from "@/features/auth/ui/SignupIncompleteGate";
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
import { initLocalNotifications } from "@/shared/lib/native/localNotifications";
import { debugLog } from "@/shared/lib/debugLog";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [splashDone, setSplashDone] = useState(false); // 비로그인 3초 타이머용
  const [homeSplashExpired, setHomeSplashExpired] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  /**
   * 첫 진입(콜드 스타트)에서 Splash가 한 번 걷혔는지.
   *
   * 홈 Splash는 `isHomeReady`에 걸려 있는데 MainSection이 **마운트마다** 그 값을
   * false로 되돌린다. 그래서 앱 안에서 홈으로 다시 들어오거나, 홈에서 다른 탭으로
   * 나가는 순간(전환이 커밋되기 전 path가 아직 '/home'인 프레임)에도 Splash가 떠서
   * 화면이 한 번 깜빡였다. 최초 로드가 끝난 뒤에는 홈의 스켈레톤이 그 자리를 받는다.
   */
  const [initialSplashDone, setInitialSplashDone] = useState(false);
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
  /**
   * 약관 3종과 사업자 정보는 **로그인 없이 열려야 한다.**
   * 카카오 비즈앱 검수·앱스토어 심사에 이 URL 을 그대로 제출하는데, 보호 경로면
   * 심사자가 링크를 눌렀을 때 로그인 화면으로 튕겨 내용 자체를 볼 수 없다.
   * (카카오는 2026-08 심사에서 "사이트 내 사업자 정보가 확인되지 않는다"며 반려했다.)
   * 네 화면 모두 정적 텍스트라 API 호출이 없어 비로그인으로 열려도 문제가 없다.
   */
  const isPublicDocPath =
    path === '/settings/terms' ||
    path === '/settings/privacy' ||
    path === '/settings/location-terms' ||
    path === '/settings/business';
  const isPublicPath =
    path === "/" ||
    isOAuthFlowPath ||
    isSanctionPath ||
    isPublicDocPath ||
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

  /**
   * 알림 초기화. **로그인 이후에만** 돈다 — 디바이스 토큰 등록 API가 인증을
   * 요구하므로 비로그인 상태에서 부르면 401이다.
   *
   * 로컬(주간 리추얼) → 원격 푸시(FCM) 순서로 **직렬**이다. 둘 다 OS 알림 권한을
   * 요청하는데 안드로이드 13+ 는 런타임 권한 대화상자를 동시에 두 개 띄우지 못한다.
   * 병렬로 부르면 나중 요청이 대화상자도 없이 거부로 떨어지고, 그게 푸시 쪽이면
   * FCM 토큰을 못 받아 BE 등록이 통째로 빠진다(=이 기기로 푸시가 영영 안 온다).
   * 로컬이 먼저 권한을 받아 두면 푸시의 요청은 대화상자 없이 granted로 끝난다.
   *
   * - 로컬: BE 발송 인프라 없이 동작한다. 목(매칭 결과)·일(채팅 마감)이 고정 일정이라
   *   기기가 스스로 예약할 수 있다.
   * - 푸시: 언제 올지 모르는 이벤트(새 메시지, 매칭 성사)를 BE가 밀어 넣는다.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    const navigate = (target: string) => router.push(target);

    // 초기화가 끝나기 전에 effect가 정리되면 늦게 도착한 정리 함수를 즉시 실행한다.
    const track = (dispose: () => void) => {
      if (disposed) dispose();
      else cleanups.push(dispose);
    };

    void (async () => {
      try {
        track(await initLocalNotifications({ navigate }));
      } catch (err: unknown) {
        console.error("[native] 로컬 알림 초기화 실패:", err);
      }
      try {
        track(await initPushNotifications({ navigate }));
      } catch (err: unknown) {
        console.error("[native] 푸시 초기화 실패:", err);
      }
    })();

    return () => {
      disposed = true;
      cleanups.forEach((dispose) => dispose());
    };
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
      // 임시 진단 로그: /home 직접 진입 시 세션 검증이 실제로 성공/실패하는지 확인한다.
      debugLog("[ClientLayout] /home 진입 시 세션 검증(refresh) 결과:", { verified: Boolean(token) });
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
    // 임시 진단 로그: 버튼을 누르지 않았는데도 홈으로 가는지 이 게이트에서 직접 확인한다.
    debugLog("[ClientLayout] 세션 게이트:", { path, loggedIn, isPublicPath });
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
    // 약관·사업자 정보 화면은 로그인 상태에서도 그대로 머물러야 한다 — 설정에서
    // 들어오는 정상 경로라 /home 으로 되돌리면 로그인 사용자는 이 화면을 아예 못 본다.
    const isHomeRedirectCandidate =
      isPublicPath &&
      !isOAuthFlowPath &&
      !isSanctionPath &&
      !isPublicDocPath &&
      path !== '/localogin';

    if (!isHomeRedirectCandidate) return;

    if (sessionVerified.current) {
      debugLog("[ClientLayout] 이미 검증된 세션 → /home 이동 (refresh 재호출 없음)");
      router.push("/home");
      return;
    }

    if (sessionVerifyInFlight.current) return;

    sessionVerifyInFlight.current = true;
    setIsVerifyingSession(true);
    tryRefreshToken().then((token) => {
      sessionVerifyInFlight.current = false;
      setIsVerifyingSession(false);
      // 임시 진단 로그: 루트(/) 진입 시 refresh 검증이 실제로 성공/실패하는지 확인한다.
      debugLog("[ClientLayout] 루트 진입 시 세션 검증(refresh) 결과:", { verified: Boolean(token) });
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
    isPublicDocPath,
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
    // 약관·사업자 정보 화면은 링크로 바로 들어오는 사람(심사자 등)이 본다. 정적
    // 텍스트라 기다릴 것이 없는데 3초 스플래시가 덮으면 그냥 안 뜨는 화면처럼 보인다.
    if (isPublicDocPath) return false;
    if (!isLoggedIn) return !splashDone;            // 비로그인: 3초 타이머
    // 홈은 첫 진입에서만 Splash가 받는다. 재진입·탭 전환은 홈 자체 스켈레톤이 받는다.
    if (path === '/home' && !initialSplashDone) return !isHomeReady && !homeSplashExpired;
    return false;                                   // 로그인 + 다른 페이지
  })();

  // Splash가 한 번 걷히면 이 세션에서는 다시 띄우지 않는다.
  useEffect(() => {
    if (!showSplash && !initialSplashDone) setInitialSplashDone(true);
  }, [showSplash, initialSplashDone]);

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
      <SignupIncompleteGate />
      {/* children은 항상 마운트 — Splash가 오버레이로 덮음 */}
      <MswProvider>{children}</MswProvider>
      {showSplash && <Splash />}
      {/* 임시 진단용 — 원인 파악 후 제거 */}
      <DebugOverlay />
    </>
  );
}
