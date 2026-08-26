"use client";

import styled from "styled-components";
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
} from "@/shared/ui";
import { SplashCarousel } from "@/components/onboarding/Carousel";
import { KakaoLogin } from "@/components/auth/KakaoLogin";
import type { KakaoLoginResult } from "@/types/kakao";

// --- Styled Components ---
const TmpContainer = styled.div`
  /**
   * box-sizing이 없으면 content-box라 실제 높이가 100dvh + padding-top 이 되어
   * 화면을 넘긴다 — 랜딩에서 스크롤이 생기던 원인이다.
   * (프로젝트에 전역 box-sizing 리셋이 없어 컴포넌트마다 직접 지정해야 한다.)
   */
  box-sizing: border-box;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* 앱에서는 상태바가 웹뷰 위에 겹친다. 웹에서는 env()가 0이라 40px 그대로다. */
  padding-top: calc(40px + env(safe-area-inset-top, 0px));
`;

interface Step0Props {
  onLoginComplete: (result: KakaoLoginResult) => void; // This prop is kept for Tutorial.tsx but the logic inside is now empty
}

export function Step0({ onLoginComplete }: Step0Props) {
  // All logic related to handleKakaoFlow, useEffect, and state has been removed
  // as it is now handled by /app/auth/callback/page.tsx.
  // This component is now only responsible for displaying the initial UI.

  return (
    <>
      <TmpContainer>
        <MainContainer>
          <TopConatiner>
            <TopTextContainer>
              <TopImgContainer src="/assets/logo/ditto.svg" />
              <Headline1 $weight="semibold">
                퀴즈로 만나는 새로운 인연
              </Headline1>
            </TopTextContainer>

            <TopCarousleContainer>
              <SplashCarousel
                images={[
                  "/assets/onboarding/lobby/lobbyImg-1.svg",
                  "/assets/onboarding/lobby/lobbyImg-2.svg",
                  "/assets/onboarding/lobby/lobbyImg-3.svg",
                ]}
                interval={2000}
              />
            </TopCarousleContainer>

            <TopProgressContainer>
              <StepItem>
                <StepperImgContainer src="/assets/onboarding/stepper/1.svg" />
                <Body1Normal
                  $weight="medium"
                  $color="var(--Semantic-Label-Neutral, var(--Label-Neutral, rgba(47, 43, 39, 0.88)))"
                >
                  매주 색다른 퀴즈를 풀어요
                </Body1Normal>
              </StepItem>

              <StepItem>
                <StepperImgContainer src="/assets/onboarding/stepper/2.svg" />
                <Body1Normal
                  $weight="medium"
                  $color="var(--Semantic-Label-Neutral, var(--Label-Neutral, rgba(47, 43, 39, 0.88)))"
                >
                  나와 같은 답을 고른 사람에게 대화를 신청해요
                </Body1Normal>
              </StepItem>

              <StepItem>
                <StepperImgContainer src="/assets/onboarding/stepper/3.svg" />
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
            <KakaoLogin onLoginComplete={onLoginComplete} />
            <Caption1
              $color="var(--color-semantic-label-alternative)"
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
