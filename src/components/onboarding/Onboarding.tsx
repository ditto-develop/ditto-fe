"use client";

/** Styled */
import { ButtonContainer, MainContainer, StepItem, StepperImgContainer, TopCarousleContainer, TopConatiner, TopImgContainer, TopProgressContainer, TopStepperContainer, TopTextContainer } from "@/styled/onboarding/Container";
import { CaptionAlternative, CaptionAlternativeBoldSpan, SubNeutralText, SubNormalText } from "@/styled/Text";


/**임시 */
import styled from "styled-components";
import { SplashCarousel } from "./Carousle";
import { KakaoShareButton } from "../Input";

const TmpContainer = styled.div`
    padding-top: 40px;
`;

export function Onboarding() {
    return(
        <TmpContainer>
            <MainContainer>
                <TopConatiner>
                    <TopTextContainer>
                        <TopImgContainer 
                            src='/logo/dittologo.svg'
                        />
                        <SubNormalText>퀴즈로 연결되는 새로운 만남의 시작</SubNormalText>
                    </TopTextContainer>
                    <TopCarousleContainer>
                        <SplashCarousel 
                              images={[
                                '/onboarding/lobbyimg/lobbyimg-1.svg',
                                '/onboarding/lobbyimg/lobbyimg-2.svg',
                                '/onboarding/lobbyimg/lobbyimg-3.svg',
                            ]}
                            interval={2000}
                        />
                    </TopCarousleContainer>
                    <TopProgressContainer>
                        <StepItem>
                            <StepperImgContainer src="/onboarding/stepper/1.svg" />
                            <SubNeutralText>매주 색다른 퀴즈를 풀어요</SubNeutralText>
                        </StepItem>

                        <StepItem>
                            <StepperImgContainer src="/onboarding/stepper/2.svg" />
                            <SubNeutralText>나와 같은 답을 고른 사람에게 대화를 신청해요</SubNeutralText>
                        </StepItem>

                        <StepItem>
                            <StepperImgContainer src="/onboarding/stepper/3.svg" />
                            <SubNeutralText>대화를 통해 만남을 이어가요</SubNeutralText>
                        </StepItem>
                    </TopProgressContainer>
                </TopConatiner>
                <ButtonContainer>
                    <KakaoShareButton />
                    <CaptionAlternative>회원가입 시 <CaptionAlternativeBoldSpan>이용약관</CaptionAlternativeBoldSpan> 및 <CaptionAlternativeBoldSpan>개인정보처리방침</CaptionAlternativeBoldSpan>에 동의하는 것으로 간주됩니다.</CaptionAlternative>
                </ButtonContainer>
            </MainContainer>
        </TmpContainer>
    );
}