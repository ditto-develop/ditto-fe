"use client";

import styled from "styled-components";

import { SplashCarousel } from "@/components/onboarding/Carousel";
import {
  StepItem,
  StepperImgContainer,
  TopProgressContainer,
} from "@/components/onboarding/OnboardingContainer";
import { APP_STORE_URL } from "@/shared/lib/appStore";
import { Body1Normal, Button, Caption1, Headline1 } from "@/shared/ui";

interface WebDownloadViewProps {
  onAndroidNotify: () => void;
  onOpenDocument: (path: "/settings/terms" | "/settings/privacy" | "/support") => void;
}

const STEPS = [
  { icon: "/assets/onboarding/stepper/1.svg", text: "매주 색다른 퀴즈를 풀어요" },
  { icon: "/assets/onboarding/stepper/2.svg", text: "나와 같은 답을 고른 사람에게 대화를 신청해요" },
  { icon: "/assets/onboarding/stepper/3.svg", text: "대화를 통해 만남을 이어가요" },
] as const;

/**
 * 웹 다운로드 안내. 브라우저로 들어오면 어느 주소든 이 화면이 뜬다(`shouldShowWebDownload`).
 * 위쪽은 앱 첫 화면(로그인 랜딩)과 같은 소개를 쓰고, 로그인 버튼 자리에 스토어 버튼을 둔다.
 *
 * App Store 버튼은 https 링크다 — iPhone 에서 누르면 App Store 앱의 디토 페이지로 바로 넘어간다.
 */
export function WebDownloadView({ onAndroidNotify, onOpenDocument }: WebDownloadViewProps) {
  return (
    <Page>
      <Main>
        <Hero>
          <Logo src="/assets/logo/ditto.svg" alt="ditto" />
          <Headline1 $weight="semibold" $align="center">
            퀴즈로 만나는 새로운 인연
          </Headline1>
        </Hero>

        <CarouselArea>
          <SplashCarousel
            images={[
              "/assets/onboarding/lobby/lobbyImg-1.svg",
              "/assets/onboarding/lobby/lobbyImg-2.svg",
              "/assets/onboarding/lobby/lobbyImg-3.svg",
            ]}
            interval={2000}
          />
        </CarouselArea>

        <TopProgressContainer>
          {STEPS.map((step) => (
            <StepItem key={step.icon}>
              <StepperImgContainer src={step.icon} alt="" />
              <Body1Normal $weight="medium" $color="var(--color-semantic-label-neutral)">
                {step.text}
              </Body1Normal>
            </StepItem>
          ))}
        </TopProgressContainer>
      </Main>

      <Footer>
        <Notice>
          <Body1Normal $weight="bold" $align="center" $color="var(--color-semantic-label-strong)">
            디토는 앱에서 이용할 수 있어요
          </Body1Normal>
        </Notice>

        <Actions>
          <StoreButton
            as="a"
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            $variant="solid"
            $size="large"
          >
            App Store에서 다운로드
          </StoreButton>
          <FullWidthButton type="button" $variant="outlined" $size="large" onClick={onAndroidNotify}>
            Android 출시 알림 받기
          </FullWidthButton>
          <Caption1 $align="center" $color="var(--color-semantic-label-alternative)">
            Android 앱은 준비 중이에요. 출시되면 메일로 알려 드릴게요.
          </Caption1>
        </Actions>

        <LegalLinks>
          <LegalLink type="button" onClick={() => onOpenDocument("/settings/terms")}>
            이용약관
          </LegalLink>
          <Separator aria-hidden="true">·</Separator>
          <LegalLink type="button" onClick={() => onOpenDocument("/settings/privacy")}>
            개인정보처리방침
          </LegalLink>
          <Separator aria-hidden="true">·</Separator>
          <LegalLink type="button" onClick={() => onOpenDocument("/support")}>
            고객 지원
          </LegalLink>
        </LegalLinks>
      </Footer>
    </Page>
  );
}

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding-top: var(--space-10);
  background-color: var(--color-semantic-background-normal-normal);
`;

const Main = styled.main`
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
`;

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
`;

const Logo = styled.img`
  width: var(--space-24);
  height: auto;
`;

const CarouselArea = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  overflow: hidden;
`;

const Footer = styled.footer`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
`;

const Notice = styled.div`
  display: flex;
  justify-content: center;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;

/* 버튼 모양의 링크. 스토어로 가는 진짜 링크라 길게 눌러 주소를 복사할 수도 있다. */
const StoreButton = styled(Button)`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-decoration: none;
`;

const LegalLinks = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
`;

const LegalLink = styled.button`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-alternative);
  text-decoration: underline;
`;

const Separator = styled.span`
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-label-assistive);
`;
