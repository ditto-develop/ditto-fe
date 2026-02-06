"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/components/common/Text";
import styled from "styled-components";
import Tutorial from "@/components/onboarding/Tutorial";
import { ApiError, OpenAPI, UserService } from "@/lib/api";

const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
`;

function KakaoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  
  const [initialData, setInitialData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const isFetched = useRef(false);

  useEffect(() => {
    if (!code || isFetched.current) return;
    isFetched.current = true;

    const handleLoginFlow = async () => {
      console.log("Attempting login flow with code:", code);
      try {
        // 1. Get Kakao user info from our own API route
        const kakaoResponse = await fetch("/api/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const kakaoData = await kakaoResponse.json();
        if (!kakaoResponse.ok || !kakaoData.kakaoId) {
          throw new Error("카카오 사용자 정보를 가져오는데 실패했습니다.");
        }

        const kakaoId = String(kakaoData.kakaoId);

        // 2. Attempt social login
        const loginResponse = await UserService.userControllerSocialLogin({
          provider: "kakao",
          providerUserId: kakaoId,
        });
        
        console.log("Full social login response:", loginResponse);

        // 3. Handle response based on the 'success' flag in the body
        if (loginResponse.success && loginResponse.data?.accessToken) {
          // SUCCESS: Existing user logged in
          console.log("Login successful for existing user.");
          const { accessToken, refreshToken } = loginResponse.data;
          
          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }
          
          
          router.push("/home"); // Redirect to home
        } else {
          // FAILURE: New user, or other login error -> Start signup
          console.log("New user detected or login failed. Proceeding to sign-up.");
          setInitialData(kakaoData);
        }
      } catch (err: any) {
        // This will now only catch critical errors like network failure
        console.error("Authentication process failed:", err);
        setError(err.message || "알 수 없는 오류가 발생했습니다.");
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