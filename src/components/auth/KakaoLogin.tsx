"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import styled from "styled-components";

import { Headline1 } from "@/shared/ui";
import {
  loginWithExternalKakaoNative,
  startExternalSocialLogin,
} from "@/shared/lib/api/externalApi";
import { loginWithKakaoSdk } from "@/shared/lib/native/kakaoLogin";
import { describeError } from "@/shared/lib/api/apiError";
import { resolveSocialLogin } from "@/features/auth/lib/socialLoginOutcome";
import { rememberLoginAttempt, trackEvent } from "@/shared/lib/analytics";
import { isNativeApp } from "@/shared/lib/native/platform";
import type { KakaoLoginResult } from "@/types/kakao";

const ButtonContainer = styled.div`
  display: flex;
  width: 361px;
  height: 48px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  border: 1px solid var(--color-semantic-primary-normal);
  cursor: pointer; 
  background-color: transparent; 
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ButtonInnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;

`;

interface KakaoLoginProps {
  onLoginComplete?: (result: KakaoLoginResult) => void;
}

export const KakaoLogin = (_props: KakaoLoginProps) => {
  const router = useRouter();
  // 네이티브 로그인은 앱 전환을 동반해 응답이 느리다. 그 사이의 연타를 막는다.
  const isRunning = useRef(false);

  /**
   * 웹은 예전 그대로 BE 리다이렉트 로그인을 탄다.
   * 앱(그리고 플래그가 켜진 경우)만 네이티브 카카오 SDK 를 먼저 시도하고,
   * 취소가 아닌 실패는 조용히 리다이렉트 로그인으로 폴백한다 —
   * 네이티브 설정이 어긋나도 앱에서 로그인이 아예 막히는 상황을 만들지 않기 위해서다.
   */
  const handleLogin = async () => {
    if (isRunning.current) return;
    isRunning.current = true;

    /*
     * 버튼을 누른 시점의 경로다. 네이티브가 실패해 리다이렉트로 폴백하면 실제 경로는
     * 달라지는데, 그 차이는 아래 login_fail 로 드러난다. 여기서 미리 쏘는 이유는
     * 리다이렉트가 시작되면 페이지가 통째로 떠나 이벤트를 보낼 기회가 사라지기 때문이다.
     */
    const method = isNativeApp() ? "native" : "redirect";
    trackEvent("login_start", { provider: "kakao", method });
    // 리다이렉트 콜백에는 provider 가 없다. 지금 적어 둬야 콜백에서 카카오였음을 안다.
    rememberLoginAttempt({ provider: "kakao", method: "redirect" });

    try {
      /**
       * `loginWithKakaoSdk` 는 던지지 않기로 되어 있지만, 그 약속이 깨지면 이 함수가
       * 통째로 예외로 빠져나가 **폴백도 못 타고 연타 방지 래치도 안 풀린다**
       * (2026-09-07 실기기: 그래서 버튼이 영구히 죽었다). 여기서 한 번 더 받아
       * 어떤 경우에도 아래 폴백까지는 도달하게 한다.
       */
      const outcome = await loginWithKakaoSdk().catch((err: unknown) => {
        console.error("[KakaoLogin] 네이티브 로그인 호출이 예외로 끝났습니다:", describeError(err));
        return { status: "failed" as const, message: "네이티브 로그인 호출 실패" };
      });

      // 사용자가 카카오 화면에서 스스로 취소했다. 리다이렉트로 끌고 가면 안 된다.
      if (outcome.status === "cancelled") {
        trackEvent("login_cancel", { provider: "kakao", method: "native" });
        return;
      }

      if (outcome.status === "success") {
        try {
          // 교환은 반드시 웹뷰에서. 그래야 refreshToken 쿠키를 웹뷰가 갖는다.
          const result = await loginWithExternalKakaoNative(outcome.accessToken);
          const resolved = resolveSocialLogin(result);

          if (resolved.kind === "sanctioned") {
            trackEvent("login_fail", {
              provider: "kakao",
              method: "native",
              reason: "sanctioned",
            });
            router.replace(`/sanction?${resolved.query}`);
            return;
          }
          if (resolved.kind === "home") {
            trackEvent("login_success", {
              provider: "kakao",
              method: "native",
              is_new_user: false,
            });
            router.push("/home");
            return;
          }
          // 신규 회원: 토큰은 이미 저장됐다. 가입 화면은 콜백 페이지가 그대로 담당한다
          // (토큰을 쿼리에 실어 보내지 않는다 — CloudFront 액세스 로그에 남는다).
          trackEvent("login_success", {
            provider: "kakao",
            method: "native",
            is_new_user: true,
          });
          router.replace("/auth/callback?signupRequired=true");
          return;
        } catch (err: unknown) {
          console.error("[KakaoLogin] 네이티브 토큰 교환 실패, 리다이렉트 로그인으로 폴백:", describeError(err));
          trackEvent("login_fail", {
            provider: "kakao",
            method: "native",
            reason: "token_exchange_failed",
          });
        }
      } else if (outcome.status === "failed") {
        // 폴백은 그대로 타지만, 네이티브가 얼마나 새는지는 따로 보여야 한다 —
        // 네이티브 설정이 어긋나도 로그인은 되기 때문에 지표 없이는 알아채지 못한다.
        trackEvent("login_fail", {
          provider: "kakao",
          method: "native",
          reason: "native_login_failed",
        });
      }

      startExternalSocialLogin("KAKAO");
    } finally {
      isRunning.current = false;
    }
  };

  return (
    <ButtonContainer onClick={handleLogin}>
      <ButtonInnerContainer>
        <img src="/assets/logo/kakao.svg" alt="Kakao Logo" />
        <Headline1 $weight="semibold">카카오로 계속하기</Headline1>
      </ButtonInnerContainer>
    </ButtonContainer>
  );
};
