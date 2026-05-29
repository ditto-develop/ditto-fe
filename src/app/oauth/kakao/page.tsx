"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/shared/ui";
import styled from "styled-components";
import { Tutorial } from "@/components/onboarding/Tutorial";
import { handleExternalSocialCallback } from "@/shared/lib/api/externalApi";
import type { KakaoCallbackResponse, KakaoLoginResult } from "@/types/kakao";

const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
`;

const isKakaoCallbackResponse = (value: unknown): value is KakaoCallbackResponse => {
  if (!value || typeof value !== "object") return false;
  return "kakaoId" in value || "providerUserId" in value || "name" in value;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "알 수 없는 오류가 발생했습니다.";
};

const toKakaoLoginResult = (data: KakaoCallbackResponse): KakaoLoginResult => ({
  ...data,
  kakaoId: Number(data.kakaoId ?? data.providerUserId),
});

function KakaoLoginContent() {
  console.log('[src/app/oauth/kakao/page.tsx] KakaoLoginContent'); // __component_log__
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [initialData, setInitialData] = useState<KakaoLoginResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFetched = useRef(false);

  useEffect(() => {
    if (!code || isFetched.current) return;
    isFetched.current = true;

    const handleLoginFlow = async () => {
      console.log("Attempting login flow with code:", code);
      try {
        const kakaoData: unknown = await handleExternalSocialCallback("KAKAO", code);
        if (!isKakaoCallbackResponse(kakaoData)) {
          throw new Error("카카오 로그인 응답을 확인할 수 없습니다.");
        }

        if (kakaoData.accessToken) {
          // SUCCESS: Existing user logged in
          console.log("Login successful for existing user.");
          const { accessToken, refreshToken } = kakaoData;

          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }


          router.push("/home"); // Redirect to home
        } else {
          // FAILURE: New user, or other login error -> Start signup
          console.log("New user detected or login failed. Proceeding to sign-up.");
          if (!kakaoData.kakaoId && !kakaoData.providerUserId) {
            throw new Error("회원가입에 필요한 소셜 사용자 ID가 응답에 없습니다.");
          }
          setInitialData(toKakaoLoginResult(kakaoData));
        }
      } catch (err: unknown) {
        // This will now only catch critical errors like network failure
        console.error("Authentication process failed:", err);
        setError(getErrorMessage(err));
      }
    };

    handleLoginFlow();
  }, [code, router]);

  // If there was an error, display it
  if (error) {
    return (
      <LoadingContainer>
        <Body1Normal>오류가 발생했습니다:</Body1Normal>
        <Body1Normal>{error}</Body1Normal>
      </LoadingContainer>
    );
  }

  // If we have initialData, it's a new user, so render the Tutorial
  if (initialData) {
    return <Tutorial initialData={initialData} />;
  }

  // Otherwise, show a loading indicator
  return (
    <LoadingContainer>
      <Body1Normal>카카오 로그인 처리 중입니다...</Body1Normal>
    </LoadingContainer>
  );
}

export default function KakaoRedirectPage() {
  console.log('[src/app/oauth/kakao/page.tsx] KakaoRedirectPage'); // __component_log__
  // ... (rest of the component remains the same)
  return (
    <Suspense
      fallback={
        <LoadingContainer>
          <Body1Normal>페이지 로딩 중...</Body1Normal>
        </LoadingContainer>
      }
    >
      <KakaoLoginContent />
    </Suspense>
  );
}
