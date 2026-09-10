"use client";

import { Splash } from "@/components/splash/Splash";
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
import { getExternalSystemState } from "@/shared/lib/api/externalApi";
import { API_ERROR_CODE, describeError, hasApiErrorCode } from "@/shared/lib/api/apiError";
import { getGtagScriptSrc, useAnalytics } from "@/shared/lib/analytics";
import { isBootSplashPath, normalizePathname } from "@/shared/lib/routePath";
import { initAppShell } from "@/shared/lib/native/appShell";
import { initPushNotifications } from "@/shared/lib/native/pushNotifications";
import { initLocalNotifications } from "@/shared/lib/native/localNotifications";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 콜드 스타트 스플래시의 최대 유지 시간.
 *
 * 루트("/") 부팅 판정은 refresh + 계정 상태 확인 두 번의 네트워크에 걸려 있는데,
 * 일반 API fetch 에는 타임아웃이 없다(externalClient.doFetch). 네트워크가 멈추면
 * 스플래시가 영영 걷히지 않으므로 상한을 둔다 — 상한에 걸리면 로그인 버튼 화면이
 * 뜨고, 사용자는 최소한 다시 시도할 수 있다.
 */
const BOOT_SPLASH_MAX_MS = 6000;

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [splashDone, setSplashDone] = useState(false); // 비로그인 3초 타이머용
  const [homeSplashExpired, setHomeSplashExpired] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  /**
   * 로그인 상태로 루트("/")에 들어온 콜드 스타트에서 "홈으로 보낼지 / 여기 그대로 둘지"
   * 판정이 끝났는지.
   *
   * 판정은 refresh → 계정 상태 확인(getExternalSystemState) → replace("/home") 의
   * 비동기 체인이다. 이 값을 보지 않으면 체인 중간중간 Splash 가 걷혀 **로그인 버튼
   * 화면이 잠깐 스쳐 간다**(스플래시 → 로그인 → 홈 깜빡임):
   *   - 하이드레이션 직후 첫 프레임: 아직 아래 리다이렉트 effect 가 돌기 전이라
   *     isVerifyingSession 이 false 다.
   *   - refresh 응답 직후: isVerifyingSession 을 내린 뒤 계정 상태 확인 + 라우팅이
   *     남아 있어 그동안 루트 화면이 그대로 보인다.
   * 그래서 "부팅 판정이 끝날 때까지" 를 따로 들고, 여기 그대로 둘 때만 세운다.
   */
  const [rootAuthResolved, setRootAuthResolved] = useState(false);
  const [bootSplashExpired, setBootSplashExpired] = useState(false);
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
  /**
   * 로그인 상태면 홈으로 넘겨야 하는 경로(=사실상 루트 "/").
   * 리다이렉트 effect 와 Splash 계산이 같은 판정을 봐야 해서 여기서 한 번만 만든다.
   */
  const isHomeRedirectCandidate =
    isPublicPath &&
    !isOAuthFlowPath &&
    !isSanctionPath &&
    !isPublicDocPath &&
    path !== '/localogin';

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
      if (token) {
        sessionVerified.current = true;
      } else {
        clearTokens();
        setIsLoggedIn(false);
        // replace 다 — push 면 로그인 화면에서 뒤로가기를 누른 사용자가 방금 세션이
        // 죽은 /home 으로 되돌아가고, 이 effect 가 다시 로그인 화면으로 밀어내며
        // 히스토리만 한 칸씩 쌓인다(=뒤로가기가 먹지 않는다).
        router.replace("/");
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

  // 콜드 스타트 스플래시 상한(BOOT_SPLASH_MAX_MS). 하이드레이션 시점에 한 번만 건다.
  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => setBootSplashExpired(true), BOOT_SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, [isHydrated]);

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
        // 비로그인 + 보호 경로: 로그인 페이지로 리다이렉트.
        // 가드 리다이렉트는 전부 replace 다 — 히스토리에 남기면 뒤로가기가
        // 되돌아왔다가 다시 밀려나는 루프가 된다.
        router.replace("/");
      }
      return;
    }
    // 로그인 상태: 루트(/) → refresh 검증 성공 후 홈으로 리다이렉트.
    // OAuth 콜백 경로는 KakaoCallback이 라우팅을 담당하므로 제외하고,
    // /localogin도 제외한다(isHomeRedirectCandidate 참고).
    // 제재 화면은 토큰이 살아 있는 403(6006/6007) 진입도 있으므로 /home으로 되돌리지 않는다.
    // 약관·사업자 정보 화면은 로그인 상태에서도 그대로 머물러야 한다 — 설정에서
    // 들어오는 정상 경로라 /home 으로 되돌리면 로그인 사용자는 이 화면을 아예 못 본다.
    if (!isHomeRedirectCandidate) return;

    if (sessionVerified.current) {
      // replace 다 — push 면 /home 에서 뒤로가기를 눌러 루트로 돌아온 순간 이
      // effect 가 /home 을 다시 쌓아, 몇 번을 눌러도 홈에서 벗어나지 못한다.
      router.replace("/home");
      return;
    }

    if (sessionVerifyInFlight.current) return;

    sessionVerifyInFlight.current = true;
    setIsVerifyingSession(true);
    tryRefreshToken().then(async (token) => {
      sessionVerifyInFlight.current = false;
      setIsVerifyingSession(false);
      if (!token) {
        setRootAuthResolved(true);
        clearTokens();
        setIsLoggedIn(false);
        return;
      }

      /**
       * refresh 성공은 "토큰이 유효하다"만 보장하지, "계정이 실제로 앱을 쓸 수 있다"는
       * 보장하지 않는다 — 세션은 유효해도 회원가입이 완료되지 않은 계정이 있다
       * (2026-09-08 실기기 로그로 확인). 이걸 확인 안 하고 바로 홈으로 보내면 홈이
       * 카드 없이 잠깐 떴다가 회원가입 화면으로 다시 튕기는 깜빡임이 생긴다.
       * 여기서 먼저 확인해서, 회원가입 미완료면 애초에 로그인 버튼 화면에 그대로 둔다 —
       * 버튼을 누르면 정상적인 로그인 플로우가 새로 시작돼 회원가입으로 이어진다.
       */
      try {
        await getExternalSystemState();
      } catch (err: unknown) {
        console.error("[ClientLayout] 루트 진입 시 계정 상태 확인 실패:", describeError(err));
        if (hasApiErrorCode(err, API_ERROR_CODE.SIGNUP_INCOMPLETE)) {
          // 로그인 버튼 화면에 그대로 둔다. sessionVerified는 세우지 않는다 —
          // 다음 진입(또는 회원가입 완료 후)에 다시 확인해야 한다.
          setRootAuthResolved(true);
          return;
        }
        // 그 외 에러(네트워크 등)는 기존처럼 홈으로 보내 MainSection이 처리하게 둔다.
      }

      sessionVerified.current = true;
      router.replace("/home");
    });
  }, [
    isHydrated,
    isLoggedIn,
    isPublicPath,
    isHomeRedirectCandidate,
    isAdminPath,
    path,
    router,
  ]);

  // showSplash를 state 없이 순수 파생값으로 계산
  const showSplash = (() => {
    if (isAdminPath) return false;                  // 관리자 경로: 스플래시 없음
    /**
     * 스플래시가 받는 화면은 **루트(브랜드)와 홈(첫 진입) 둘뿐이다**(`isBootSplashPath`).
     * 나머지는 전부 여기서 끊는다:
     *   - OAuth 콜백: KakaoCallback이 자체 로딩 UI를 렌더한다. 토큰 세팅이 Suspense로
     *     지연되면 isLoggedIn이 stale(false)로 남아 Splash가 회원가입 폼을 영구히 덮는다.
     *   - 제재 안내: 자체 로딩 문구를 쓴다.
     *   - 약관·사업자 정보: 링크로 바로 들어오는 사람(심사자 등)이 본다. 정적 텍스트라
     *     기다릴 것이 없는데 스플래시가 덮으면 그냥 안 뜨는 화면처럼 보인다.
     *   - 소개노트(`/profile/{id}`)·채팅방 같은 동적 라우트: 진입할 때마다 문서가 새로
     *     떠서(하드 내비게이션) 스플래시가 떴다 사라지는 번쩍임이 된다. 스켈레톤이 받는다.
     */
    if (!isBootSplashPath(path)) return false;
    if (!isHydrated) return true;                   // SSR / hydration 전
    if (isVerifyingSession) return true;            // refresh 검증 중
    /**
     * 로그인 상태로 루트("/")에 들어온 콜드 스타트: **홈이 뜰 때까지** 스플래시를 유지한다.
     *
     * 이 홀드가 없으면 refresh 응답과 계정 상태 확인 사이, 그리고 하이드레이션 직후
     * 첫 프레임에 스플래시가 걷혀 로그인 버튼 화면이 스쳐 간다
     * (스플래시 → 로그인 → 홈). 판정이 끝나 여기 그대로 두기로 했거나
     * (`rootAuthResolved`) 상한에 걸리면 걷힌다. `initialSplashDone` 을 함께 보는 건
     * 이 홀드를 **콜드 스타트 한 번**으로 못 박기 위해서다 — 로그아웃으로 루트에
     * 돌아왔을 때 isLoggedIn 이 아직 동기화되지 않은 한 프레임에 스플래시가 번쩍이면 안 된다.
     */
    if (
      isLoggedIn &&
      isHomeRedirectCandidate &&
      !initialSplashDone &&
      !rootAuthResolved &&
      !bootSplashExpired
    ) {
      return true;
    }
    /**
     * 비로그인: 콜드 스타트 브랜드 스플래시(3초 타이머).
     *
     * `initialSplashDone`을 함께 본다 — 세션 중 로그아웃으로 "/"에 돌아왔을 때도
     * 3초를 다시 물리면, 기다릴 것이 아무것도 없는데 로그아웃이 그만큼 느려
     * 보인다(로그인 상태로 앱을 켠 세션은 타이머가 돈 적이 없어 `splashDone`이
     * 계속 false라 매번 3초 전부 물렸다).
     */
    if (!isLoggedIn) return !splashDone && !initialSplashDone;
    // 홈은 첫 진입에서만 Splash가 받는다. 재진입·탭 전환은 홈 자체 스켈레톤이 받는다.
    if (path === '/home' && !initialSplashDone) return !isHomeReady && !homeSplashExpired;
    return false;                                   // 로그인 + 다른 페이지
  })();

  // Splash가 한 번 걷히면 이 세션에서는 다시 띄우지 않는다.
  useEffect(() => {
    if (!showSplash && !initialSplashDone) setInitialSplashDone(true);
  }, [showSplash, initialSplashDone]);

  /**
   * 계측(GA4). 화면 진입·체류 시간과 기간/주차 컨텍스트를 담당한다.
   *
   * `enabled` 에 `!showSplash` 를 주는 게 핵심이다 — 스플래시가 덮고 있는 동안은
   * 사용자가 그 화면을 본 게 아니다. 특히 로그인 상태의 콜드 스타트는 루트("/")가
   * 최대 6초간 스플래시 아래 마운트돼 있다가 /home 으로 replace 되므로, 그대로 세면
   * 가입 퍼널 입구인 landing 화면의 지표가 통째로 망가진다.
   *
   * 측정 ID 가 없으면(로컬 dev · Cypress · Storybook) 전부 no-op 이다.
   */
  useAnalytics({ enabled: !showSplash, isLoggedIn });

  const gtagScriptSrc = getGtagScriptSrc();

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
      {/* gtag.js. 측정 ID 가 없으면 아예 붙이지 않는다. 로드에 실패해도(광고 차단 등)
          계측 호출은 전부 no-op 이라 앱 동작에는 영향이 없다. */}
      {gtagScriptSrc && <Script src={gtagScriptSrc} strategy="afterInteractive" />}
      <SanctionGate />
      <SignupIncompleteGate />
      {/* children은 항상 마운트 — Splash가 오버레이로 덮음 */}
      <MswProvider>{children}</MswProvider>
      {showSplash && <Splash />}
    </>
  );
}
