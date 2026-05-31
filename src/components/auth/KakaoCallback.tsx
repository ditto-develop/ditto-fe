"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/shared/ui";
import styled from "styled-components";
import { Tutorial } from "@/components/onboarding/Tutorial";
import { handleExternalSocialCallback } from "@/shared/lib/api/externalApi";
import type { KakaoLoginResult } from "@/types/kakao";

const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
`;

type CallbackData = { accessToken?: string | null; refreshToken?: string | null };

const isCallbackData = (value: unknown): value is CallbackData =>
  !!value && typeof value === "object" && "accessToken" in value;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "알 수 없는 오류가 발생했습니다.";
};

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  // 신규 회원 진입 시 빈 initialData({})로 Tutorial step 1에서 시작
  const [initialData, setInitialData] = useState<KakaoLoginResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFetched = useRef(false);

  useEffect(() => {
    if (oauthError) {
      setError(oauthErrorDescription || `카카오 로그인이 취소되었거나 실패했습니다. (${oauthError})`);
      return;
    }
    if (!code || isFetched.current) return;
    isFetched.current = true;

    const handleLoginFlow = async () => {
      try {
        const raw: unknown = await handleExternalSocialCallback("KAKAO", code);
        if (!isCallbackData(raw)) {
          throw new Error("카카오 로그인 응답을 확인할 수 없습니다.");
        }

        if (raw.accessToken) {
          // 기존 회원: 토큰 저장 후 홈으로
          localStorage.setItem("accessToken", raw.accessToken);
          if (raw.refreshToken) {
            localStorage.setItem("refreshToken", raw.refreshToken);
          }
          router.push("/home");
        } else {
          // 신규 회원: kakaoId 없이 회원가입 단계 진입
          setInitialData({});
        }
      } catch (err: unknown) {
        console.error("Authentication process failed:", err);
        setError(getErrorMessage(err));
      }
    };

    handleLoginFlow();
  }, [code, oauthError, oauthErrorDescription, router]);

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
