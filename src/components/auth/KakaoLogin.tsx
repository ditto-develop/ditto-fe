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
import { resolveSocialLogin } from "@/features/auth/lib/socialLoginOutcome";
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

    try {
      const outcome = await loginWithKakaoSdk();

      // 사용자가 카카오 화면에서 스스로 취소했다. 리다이렉트로 끌고 가면 안 된다.
      if (outcome.status === "cancelled") return;

      if (outcome.status === "success") {
        try {
          // 교환은 반드시 웹뷰에서. 그래야 refreshToken 쿠키를 웹뷰가 갖는다.
          const result = await loginWithExternalKakaoNative(outcome.accessToken);
          const resolved = resolveSocialLogin(result);

          if (resolved.kind === "sanctioned") {
            router.replace(`/sanction?${resolved.query}`);
            return;
          }
          if (resolved.kind === "home") {
            router.push("/home");
            return;
          }
          // 신규 회원: 토큰은 이미 저장됐다. 가입 화면은 콜백 페이지가 그대로 담당한다
          // (토큰을 쿼리에 실어 보내지 않는다 — CloudFront 액세스 로그에 남는다).
          router.replace("/auth/callback?signupRequired=true");
          return;
        } catch (err: unknown) {
          console.error("[KakaoLogin] 네이티브 토큰 교환 실패, 리다이렉트 로그인으로 폴백:", err);
        }
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
