"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { useToast } from "@/context/ToastContext";
import { Headline1 } from "@/shared/ui";
import { loginWithExternalAppleNative } from "@/shared/lib/api/externalApi";
import { isNativeAppleLoginAvailable, loginWithAppleSdk } from "@/shared/lib/native/appleLogin";
import { resolveSocialLogin } from "@/features/auth/lib/socialLoginOutcome";

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
  border: 0;
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
 * Sign in with Apple 버튼 (iOS 앱 전용).
 *
 * 웹·안드로이드에서는 **아무것도 렌더하지 않는다.** 노출 조건은
 * `isNativeAppleLoginAvailable()` 한 곳에만 있다.
 *
 * 카카오와 달리 **폴백 경로가 없다.** 카카오는 네이티브가 실패하면 리다이렉트 로그인으로
 * 흘려보낼 수 있지만, 애플은 이 경로가 유일하다. 그래서 실패는 토스트로 알리고 화면에
 * 그대로 머문다 — 사용자는 카카오 버튼으로 계속할 수 있다.
 */
export const AppleLogin = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const isRunning = useRef(false);
  const [pending, setPending] = useState(false);

  /**
   * 정적 export 라 프리렌더 시점에는 항상 웹(=false)이다. 마운트 후에 판정하지 않으면
   * 앱에서 버튼이 영영 나타나지 않거나 하이드레이션이 어긋난다.
   */
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(isNativeAppleLoginAvailable());
  }, []);

  if (!available) return null;

  const handleLogin = async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    setPending(true);

    try {
      const outcome = await loginWithAppleSdk();

      // 사용자가 애플 시트에서 스스로 취소했다. 아무 일도 일어나지 않아야 한다.
      if (outcome.status === "cancelled" || outcome.status === "unavailable") return;

      if (outcome.status === "failed") {
        showToast("Apple 로그인에 실패했어요. 다시 시도해 주세요.", "error");
        return;
      }

      try {
        // 교환은 반드시 웹뷰에서. 그래야 refreshToken 쿠키를 웹뷰가 갖는다.
        const result = await loginWithExternalAppleNative({
          identityToken: outcome.identityToken,
          authorizationCode: outcome.authorizationCode,
          nonce: outcome.nonce,
          fullName: outcome.fullName,
        });
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
      } catch (err: unknown) {
        console.error("[AppleLogin] 네이티브 토큰 교환 실패:", err);
        showToast("로그인 처리에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
      }
    } finally {
      isRunning.current = false;
      setPending(false);
    }
  };

  return (
    <ButtonContainer type="button" onClick={handleLogin} disabled={pending}>
      <ButtonInnerContainer>
        <img src="/assets/logo/apple.svg" alt="" aria-hidden="true" />
        <Headline1 $weight="semibold" $color="var(--color-semantic-static-white)">
          Apple로 계속하기
        </Headline1>
      </ButtonInnerContainer>
    </ButtonContainer>
  );
};
