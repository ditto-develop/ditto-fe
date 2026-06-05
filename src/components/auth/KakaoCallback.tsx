"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/shared/ui";
import styled from "styled-components";
import { Tutorial } from "@/components/onboarding/Tutorial";
import { clearTokens, setTokens } from "@/shared/lib/auth";
import { getExternalCurrentUser } from "@/shared/lib/api/externalApi";
import type { KakaoLoginResult } from "@/types/kakao";

const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
`;

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 백엔드가 OAuth 전 과정을 처리한 뒤 이 경로로 리다이렉트한다.
  // 신규/기존 회원 모두 accessToken을 발급받아 저장한다.
  // - signupRequired=true → 신규 회원 → 회원가입(Tutorial)
  // - 그 외 → 기존 회원 → 로그인(/home)
  const accessToken = searchParams.get("accessToken");
  const signupRequired = searchParams.get("signupRequired") === "true";
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  // 신규 회원 진입 시 빈 initialData({})로 Tutorial step 1에서 시작
  const [initialData, setInitialData] = useState<KakaoLoginResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isHandled = useRef(false);

  useEffect(() => {
    if (isHandled.current) return;

    if (oauthError) {
      isHandled.current = true;
      setError(oauthErrorDescription || `카카오 로그인이 취소되었거나 실패했습니다. (${oauthError})`);
      return;
    }

    isHandled.current = true;

    // 백엔드가 발급한 토큰은 신규/기존 회원 모두 동일하게 저장한다.
    // 직전 계정의 잔여 토큰이 섞이지 않도록 먼저 비우고 저장한다.
    if (accessToken) {
      clearTokens();
      setTokens(accessToken);
    }

    if (signupRequired) {
      // 신규 회원: 카카오 정보 기반 현재 사용자 정보(이메일/생년월일)를 받아와
      // 회원가입(Tutorial) 단계로 넘긴다. 실패해도 빈 값으로 진입은 가능하게 한다.
      getExternalCurrentUser()
        .then((me) => {
          console.log("[KakaoCallback] /api/v1/users/me →", me);
          setInitialData({
            email: me.email ?? undefined,
            birthDate: me.birthDate ?? undefined,
          });
        })
        .catch((err) => {
          console.error("[KakaoCallback] /api/v1/users/me 조회 실패:", err);
          setInitialData({});
        });
    } else {
      // 기존 회원: 홈으로
      router.push("/home");
    }
  }, [accessToken, signupRequired, oauthError, oauthErrorDescription, router]);

  if (error) {
    return (
      <LoadingContainer>
        <Body1Normal>오류가 발생했습니다:</Body1Normal>
        <Body1Normal>{error}</Body1Normal>
      </LoadingContainer>
    );
  }

  // initialData({})가 설정되면 신규 회원 → Tutorial step 1부터 시작
  if (initialData) {
    return <Tutorial initialData={initialData} />;
  }

  return (
    <LoadingContainer>
      <Body1Normal>카카오 로그인 처리 중입니다...</Body1Normal>
    </LoadingContainer>
  );
}

export function KakaoCallback() {
  return (
    <Suspense
      fallback={
        <LoadingContainer>
          <Body1Normal>페이지 로딩 중...</Body1Normal>
        </LoadingContainer>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
