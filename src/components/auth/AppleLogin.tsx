"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { useToast } from "@/context/ToastContext";
import { Caption1, Headline1 } from "@/shared/ui";
import {
  loginWithExternalAppleNative,
  startExternalSocialLogin,
} from "@/shared/lib/api/externalApi";
import {
  isAppleLoginEnabled,
  isNativeAppleLoginAvailable,
  loginWithAppleSdk,
} from "@/shared/lib/native/appleLogin";
import { describeError } from "@/shared/lib/api/apiError";
import { resolveSocialLogin } from "@/features/auth/lib/socialLoginOutcome";
import { rememberLoginAttempt, trackEvent } from "@/shared/lib/analytics";

/**
 * 카카오 버튼과 **같은 크기·같은 모서리**여야 한다. 애플 HIG 는 Sign in with Apple 버튼이
 * 다른 소셜 로그인 버튼보다 작거나 덜 눈에 띄면 안 된다고 규정한다.
 *
 * 색은 애플이 정한 세 가지(검정/흰색/흰색+테두리) 중 검정이다. 배경·글자에 임의 색을
 * 쓸 수 없어 static 토큰을 쓴다 — 테마와 무관하게 고정이어야 하는 자리다.
 */
const ButtonContainer = styled.button`
  display: flex;
  width: 361px;
  height: 48px;
  justify-content: center;
  align-items: center;
  padding: 0;
  border-radius: 12px;
  /*
   * 카카오 버튼과 **같은 상자 계산**을 강제한다. 카카오 쪽은 div 에 1px 테두리를 둔
   * 361x48 이고, 프로젝트에 전역 box-sizing 리셋이 없어 실제로는 363x50 으로 그려진다.
   * 반면 button 의 UA 기본값은 border-box 라, 같은 선언을 그대로 두면 애플 버튼만
   * 361x48 이 되어 2px 작아지고 좌우가 어긋난다 — 애플 HIG 는 이 버튼이 다른 소셜
   * 버튼보다 작은 것을 금지한다. 테두리 색은 배경과 같아 보이지 않는다.
   */
  box-sizing: content-box;
  border: 1px solid var(--color-semantic-static-black);
  cursor: pointer;
  background-color: var(--color-semantic-static-black);
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const ButtonInnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
`;

/**
 * 버튼과 안내 문구를 한 덩어리로 묶는다. 문구가 버튼보다 부모의 gap 만큼 떨어지면
 * 서로 다른 항목처럼 보인다.
 */
const AppleArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
`;

/**
 * Sign in with Apple 버튼.
 *
 * App Store 가이드라인 4.8 이 요구하는 "동등한 로그인 수단"이다. 경로가 둘이다
 * (BE 위키 `Frontend-Apple-Login-Guide`):
 *
 * - **iOS 앱** — 네이티브 SDK 로 identityToken 을 받아 웹뷰가 교환한다.
 * - **웹 · 안드로이드 앱** — 카카오와 똑같은 리다이렉트. `/auth/callback` 이 그대로 받는다.
 *
 * 노출 조건은 `isAppleLoginEnabled()` 한 곳이고, 그 안에서 경로만 갈린다.
 *
 * 네이티브 경로에는 **폴백이 없다.** 카카오는 실패하면 리다이렉트로 흘려보낼 수 있지만
 * 애플은 이 경로가 유일하다. 그래서 실패는 토스트로 알리고 화면에 머문다 — 사용자는
 * 카카오 버튼으로 계속할 수 있다.
 */
export const AppleLogin = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const isRunning = useRef(false);
  const [pending, setPending] = useState(false);

  /**
   * 정적 export 라 프리렌더 시점에는 플래그만 보이고 플랫폼은 알 수 없다. 마운트 후에
   * 판정하지 않으면 앱에서 네이티브 경로를 영영 타지 못하거나 하이드레이션이 어긋난다.
   */
  const [available, setAvailable] = useState(false);
  const [useNative, setUseNative] = useState(false);
  useEffect(() => {
    setAvailable(isAppleLoginEnabled());
    setUseNative(isNativeAppleLoginAvailable());
  }, []);

  if (!available) return null;

  const handleLogin = async () => {
    trackEvent("login_start", { provider: "apple", method: useNative ? "native" : "redirect" });

    // 웹·안드로이드는 리다이렉트 한 줄이다. 카카오와 같은 경로를 provider 만 바꿔 탄다.
    if (!useNative) {
      // 리다이렉트 콜백에는 provider 가 없다. 지금 적어 둬야 콜백에서 애플이었음을 안다.
      rememberLoginAttempt({ provider: "apple", method: "redirect" });
      startExternalSocialLogin("APPLE");
      return;
    }

    if (isRunning.current) return;
    isRunning.current = true;
    setPending(true);

    try {
      const outcome = await loginWithAppleSdk();

      // 사용자가 애플 시트에서 스스로 취소했다. 아무 일도 일어나지 않아야 한다.
      if (outcome.status === "cancelled" || outcome.status === "unavailable") {
        // unavailable 은 취소가 아니라 "이 기기에서 못 쓴다"다. 원인이 달라 이유를 남긴다.
        if (outcome.status === "cancelled") {
          trackEvent("login_cancel", { provider: "apple", method: "native" });
        } else {
          trackEvent("login_fail", {
            provider: "apple",
            method: "native",
            reason: "native_unavailable",
          });
        }
        return;
      }

      if (outcome.status === "failed") {
        trackEvent("login_fail", {
          provider: "apple",
          method: "native",
          reason: "native_login_failed",
        });
        showToast("Apple 로그인에 실패했어요. 다시 시도해 주세요.", "error");
        return;
      }

      try {
        // 교환은 반드시 웹뷰에서. 그래야 refreshToken 쿠키를 웹뷰가 갖는다.
        const result = await loginWithExternalAppleNative({
          identityToken: outcome.identityToken,
          rawNonce: outcome.rawNonce,
          name: outcome.name,
        });
        const resolved = resolveSocialLogin(result);

        if (resolved.kind === "sanctioned") {
          trackEvent("login_fail", { provider: "apple", method: "native", reason: "sanctioned" });
          router.replace(`/sanction?${resolved.query}`);
          return;
        }
        if (resolved.kind === "home") {
          trackEvent("login_success", {
            provider: "apple",
            method: "native",
            is_new_user: false,
          });
          router.push("/home");
          return;
        }
        // 신규 회원: 토큰은 이미 저장됐다. 가입 화면은 콜백 페이지가 그대로 담당한다
        // (토큰을 쿼리에 실어 보내지 않는다 — CloudFront 액세스 로그에 남는다).
        trackEvent("login_success", { provider: "apple", method: "native", is_new_user: true });
        router.replace("/auth/callback?signupRequired=true");
      } catch (err: unknown) {
        console.error("[AppleLogin] 네이티브 토큰 교환 실패:", describeError(err));
        trackEvent("login_fail", {
          provider: "apple",
          method: "native",
          reason: "token_exchange_failed",
        });
        showToast("로그인 처리에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
      }
    } finally {
      isRunning.current = false;
      setPending(false);
    }
  };

  return (
    <AppleArea>
      <ButtonContainer type="button" onClick={handleLogin} disabled={pending}>
        <ButtonInnerContainer>
          <img src="/assets/logo/apple.svg" alt="" aria-hidden="true" />
          <Headline1 $weight="semibold" $color="var(--color-semantic-static-white)">
            Apple로 계속하기
          </Headline1>
        </ButtonInnerContainer>
      </ButtonContainer>
      {/*
        카카오와 애플은 **별도 회원**이다. 같은 사람이 카카오로 가입한 뒤 애플로 로그인하면
        새 계정이 된다 — 애플의 비공개 릴레이 주소는 신뢰할 수 없고, 이메일 일치를 계정 병합
        근거로 삼는 것은 계정 탈취 경로라 BE 가 잇지 않기로 했다
        (위키 Frontend-Apple-Login-Guide §3). 안내가 없으면 "가입했는데 처음부터 다시
        하라고 한다"는 문의가 된다.
      */}
      <Caption1 $color="var(--color-semantic-label-alternative)" $align="center">
        이전에 카카오로 시작하셨다면 카카오로 로그인해 주세요.
      </Caption1>
    </AppleArea>
  );
};
