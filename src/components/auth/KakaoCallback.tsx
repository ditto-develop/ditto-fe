"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/shared/ui";
import styled from "styled-components";
import { Tutorial } from "@/components/onboarding/Tutorial";
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
  // - accessToken/refreshToken 파라미터가 있으면 기존 회원 → 로그인
  // - 파라미터가 없으면 신규 회원 → 회원가입(Tutorial)
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
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

    if (accessToken) {
      // 기존 회원: 백엔드가 발급한 토큰 저장 후 홈으로
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      router.push("/home");
    } else {
      // 신규 회원: 토큰 없이 회원가입 단계 진입
      setInitialData({});
    }
  }, [accessToken, refreshToken, oauthError, oauthErrorDescription, router]);

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
