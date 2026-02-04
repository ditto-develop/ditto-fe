"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/display/Nav";
import styled from "styled-components";

// 스타일 컴포넌트 (기존 유지)
import {
  ButtonContainer,
  MainContainer,
  StepItem,
  StepperImgContainer,
  TopCarousleContainer,
  TopConatiner,
  TopImgContainer,
  TopProgressContainer,
  TopTextContainer,
} from "@/components/onboarding/OnboardingContainer";
import {
  Caption1,
  UnderlineBoldSpan,
  Body1Normal,
  Headline1,
} from "@/components/common/Text";
import { SplashCarousel } from "../Carousle";
import { KakaoLogin } from "@/components/input/KakaoLogin";

// --- Types based on OpenAPI ---
interface SocialLoginRequest {
  provider: "KAKAO" | "GOOGLE" | "APPLE";
  providerUserId: string;
}

interface UserDto {
  id: string;
  name: string;
  nickname: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  role: any;
  // ... 기타 필요한 필드
}

interface LoginResponseDto {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
  };
  error?: string;
}

// --- Styled Components ---
const TmpContainer = styled.div`
  padding-top: 40px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  gap: 16px;
`;

interface Step0Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoginComplete: (result: any) => void;
}

export function Step0({ onLoginComplete }: Step0Props) {  
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [isLoading, setIsLoading] = useState(false);
  
  // API 중복 호출 방지
  const hasFetched = useRef(false);

  // 1. 카카오 인증 및 백엔드 로그인 로직
  const handleKakaoFlow = async (authCode: string) => {
    setIsLoading(true);
    try {
      // [단계 1] Next.js API Route를 통해 카카오 토큰 및 사용자 정보 조회
      // (클라이언트 시크릿 보호를 위해 Next.js 서버 사이드에서 수행 권장)
      const kakaoResponse = await fetch("/api/kakao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode }),
      });

      const kakaoData = await kakaoResponse.json();

      if (!kakaoResponse.ok || !kakaoData.id) {
        throw new Error("카카오 정보를 가져오는데 실패했습니다.");
      }

      const kakaoId = String(kakaoData.id); // providerUserId

      // [단계 2] 백엔드 API (OpenAPI Spec) 호출하여 가입 여부 확인
      // POST /api/users/social-login
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      
      const loginPayload: SocialLoginRequest = {
        provider: "KAKAO",
        providerUserId: kakaoId,
      };

      const loginResponse = await fetch(`${backendUrl}/api/users/social-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      });

      // [단계 3] 응답에 따른 분기 처리
      if (loginResponse.ok) {
        // 200 OK: 이미 가입된 유저 -> 로그인 성공 처리
        const result: LoginResponseDto = await loginResponse.json();
        
        // 토큰 저장 (예시)
        if (result.data) {
          localStorage.setItem("accessToken", result.data.accessToken);
          localStorage.setItem("refreshToken", result.data.refreshToken);
        }

        // 상위 컴포넌트(Tutorial)로 결과 전달 -> 메인으로 이동시킴
        onLoginComplete({
          isRegistered: true,
          ...result.data?.user
        });

      } else if (loginResponse.status === 404) {
        // 404 Not Found: 미가입 유저 -> 회원가입 단계(Step 1)로 진행
        console.log("신규 회원입니다. 회원가입 절차를 진행합니다.");
        
        onLoginComplete({
          isRegistered: false,
          kakaoId: kakaoId,
          // 카카오에서 받아온 프로필 정보로 폼 프리필(Pre-fill)
          email: kakaoData.kakao_account?.email,
          profileImage: kakaoData.properties?.profile_image,
          nickname: kakaoData.properties?.nickname,
          gender: kakaoData.kakao_account?.gender,
        });

      } else {
        // 그 외 에러 (400, 500 등)
        const errorData = await loginResponse.json();
        throw new Error(errorData.error?.message || "로그인 처리 중 오류가 발생했습니다.");
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login Process Error:", error);
      alert(error.message || "로그인 중 문제가 발생했습니다.");
      setIsLoading(false);
      // 에러 발생 시 URL의 code 파라미터를 지워주는 것이 좋음 (선택 사항)
    }
  };

  useEffect(() => {
    if (code && !hasFetched.current) {
      hasFetched.current = true;
      handleKakaoFlow(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (isLoading) {
    return (
      <LoadingOverlay>
        <img src="/logo/dittologo.svg" alt="logo" style={{ width: '80px' }} />
        <Body1Normal>디토에 오신 것을 환영합니다!</Body1Normal>
        <Caption1 $color="#888">잠시만 기다려주세요...</Caption1>
      </LoadingOverlay>
    );
  }

  return (
    <>
      <TmpContainer>
        <MainContainer>
          <TopConatiner>
            <TopTextContainer>
              <TopImgContainer src="/logo/dittologo.svg" />
              <Headline1 $weight="semibold">
                퀴즈로 연결되는 새로운 만남의 시작
              </Headline1>
            </TopTextContainer>

            <TopCarousleContainer>
              <SplashCarousel
                images={[
                  "/onboarding/lobbyimg/lobbyimg-1.svg",
                  "/onboarding/lobbyimg/lobbyimg-2.svg",
                  "/onboarding/lobbyimg/lobbyimg-3.svg",
                ]}
                interval={2000}
              />
            </TopCarousleContainer>

            <TopProgressContainer>
              <StepItem>
                <StepperImgContainer src="/onboarding/stepper/1.svg" />
                <Body1Normal
                  $weight="medium"
                  $color="var(--Semantic-Label-Neutral, var(--Label-Neutral, rgba(47, 43, 39, 0.88)))"
                >
                  매주 색다른 퀴즈를 풀어요
                </Body1Normal>
              </StepItem>

              <StepItem>
                <StepperImgContainer src="/onboarding/stepper/2.svg" />
                <Body1Normal
                  $weight="medium"
                  $color="var(--Semantic-Label-Neutral, var(--Label-Neutral, rgba(47, 43, 39, 0.88)))"
                >
                  나와 같은 답을 고른 사람에게 대화를 신청해요
                </Body1Normal>
              </StepItem>

              <StepItem>
                <StepperImgContainer src="/onboarding/stepper/3.svg" />
                <Body1Normal
                  $weight="medium"
                  $color="var(--Semantic-Label-Neutral, var(--Label-Neutral, rgba(47, 43, 39, 0.88)))"
                >
                  대화를 통해 만남을 이어가요
                </Body1Normal>
              </StepItem>
            </TopProgressContainer>
          </TopConatiner>

          <ButtonContainer>
            <KakaoLogin />
            <Caption1
              $color="var(--Semantic-Label-Alternative, var(--Label-Alternative, rgba(47, 43, 39, 0.61)))"
            >
              회원가입 시{" "}
              <UnderlineBoldSpan>이용약관</UnderlineBoldSpan> 및{" "}
              <UnderlineBoldSpan>개인정보처리방침</UnderlineBoldSpan>
              에 동의하는 것으로 간주됩니다.
            </Caption1>
          </ButtonContainer>
        </MainContainer>
      </TmpContainer>
    </>
  );
}