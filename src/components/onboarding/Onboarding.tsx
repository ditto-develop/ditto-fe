"use client";

/** Styled */
import {
  ButtonContainer,
  MainContainer,
  StepItem,
  StepperImgContainer,
  TopCarousleContainer,
  TopConatiner,
  TopImgContainer,
  TopProgressContainer,
  TopStepperContainer,
  TopTextContainer,
} from "@/styled/onboarding/Container";
import {
  Caption1,
  UnderlineBoldSpan,
  Body1Normal,
  Headline1,
} from "@/styled/Text";

/**임시 */
import styled from "styled-components";
import { SplashCarousel } from "./Carousle";
import { KakaoShareButton } from "../TextField";
import Nav from "../Nav";

const TmpContainer = styled.div`
  padding-top: 40px;
`;

export function Onboarding() {
  return (
    <>
      <Nav />

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
            <KakaoShareButton />
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
