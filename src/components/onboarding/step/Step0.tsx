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
  Body1Normal,
  Headline1,
} from "@/shared/ui";
import { SplashCarousel } from "@/components/onboarding/Carousel";
import { AppleLogin } from "@/components/auth/AppleLogin";
import { KakaoLogin } from "@/components/auth/KakaoLogin";
import { BUSINESS_INFO } from "@/shared/lib/businessInfo";
import type { KakaoLoginResult } from "@/types/kakao";
import { useRouter } from "next/navigation";

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

/**
 * 로그인 버튼 아래 영역. 공용 `ButtonContainer`는 높이가 160px로 고정이라
 * 약관·사업자 정보 문구가 붙으면 잘린다. 이 화면에서만 높이를 내용에 맡긴다.
 */
const LoginFooter = styled(ButtonContainer)`
  height: auto;
  min-height: 160px;
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
  gap: var(--space-3);
`;

const PolicyLink = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-decoration-line: underline;
  cursor: pointer;
`;

const BusinessArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
`;

const ContactLink = styled.a`
  color: inherit;
  font: inherit;
  text-decoration-line: underline;
`;

interface Step0Props {
  onLoginComplete: (result: KakaoLoginResult) => void; // This prop is kept for Tutorial.tsx but the logic inside is now empty
}

export function Step0({ onLoginComplete }: Step0Props) {
  // All logic related to handleKakaoFlow, useEffect, and state has been removed
  // as it is now handled by /app/auth/callback/page.tsx.
  // This component is now only responsible for displaying the initial UI.
  const router = useRouter();

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

          <LoginFooter>
            <KakaoLogin onLoginComplete={onLoginComplete} />
            {/*
              App Store 가이드라인 4.8 이 요구하는 "동등한 로그인 수단"이라 카카오 버튼과
              크기·모서리를 맞춘다 — 애플 HIG 는 이 버튼이 다른 소셜 버튼보다 덜 눈에 띄는
              것을 금지한다. iOS 앱은 네이티브 시트, 웹·안드로이드는 카카오와 같은
              리다이렉트를 탄다. 플래그가 꺼져 있으면 null 을 렌더한다.
            */}
            <AppleLogin />
            <Caption1
              $color="var(--color-semantic-label-alternative)"
              $align="center"
            >
              회원가입 시{" "}
              <PolicyLink type="button" onClick={() => router.push("/settings/terms")}>
                이용약관
              </PolicyLink>{" "}
              및{" "}
              <PolicyLink type="button" onClick={() => router.push("/settings/privacy")}>
                개인정보처리방침
              </PolicyLink>
              에 동의하는 것으로 간주됩니다.
            </Caption1>
            {/*
              사업자 정보와 문의처는 **로그인 전 화면에서 보이고 눌려야 한다.** 카카오
              비즈앱 심사자는 로그인을 통과하지 못한 상태로 사이트를 확인하므로, 설정
              안에만 두면 "사이트 내 사업자 정보가 확인되지 않는다"로 다시 반려된다.
              나머지 항목(소재지·업태·종목 등)은 아래 '사업자 정보'에서 이어진다.
            */}
            <BusinessArea>
              <Caption1 $color="var(--color-semantic-label-alternative)" $align="center">
                {BUSINESS_INFO.companyName} · 사업자등록번호 {BUSINESS_INFO.registrationNumber}
              </Caption1>
              <Caption1 $color="var(--color-semantic-label-alternative)" $align="center">
                <ContactLink href={`mailto:${BUSINESS_INFO.contactEmail}`}>
                  {BUSINESS_INFO.contactEmail}
                </ContactLink>
              </Caption1>
              <Caption1 $color="var(--color-semantic-label-alternative)" $align="center">
                <PolicyLink type="button" onClick={() => router.push("/settings/business")}>
                  사업자 정보
                </PolicyLink>
              </Caption1>
            </BusinessArea>
          </LoginFooter>
        </MainContainer>
      </TmpContainer>
    </>
  );
}
