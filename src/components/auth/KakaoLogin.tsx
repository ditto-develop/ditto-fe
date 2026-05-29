"use client";

import { Headline1 } from "@/shared/ui";
import { startExternalSocialLogin } from "@/shared/lib/api/externalApi";
import type { KakaoLoginResult } from "@/types/kakao";
import styled from "styled-components";

const ButtonContainer = styled.div`
  display: flex;
  width: 361px;
  height: 48px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  border: 1px solid var(--color-semantic-primary-normal);
  cursor: pointer; 
  background-color: transparent; 
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ButtonInnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;

`;

interface KakaoLoginProps {
  onLoginComplete?: (result: KakaoLoginResult) => void;
}

export const KakaoLogin = (_props: KakaoLoginProps) => {
  const handleLogin = () => {
    startExternalSocialLogin("KAKAO");
  };

  return (
    <ButtonContainer onClick={handleLogin}>
      <ButtonInnerContainer>
        <img src="/assets/logo/kakao.svg" alt="Kakao Logo" />
        <Headline1 $weight="semibold">카카오로 계속하기</Headline1>
      </ButtonInnerContainer>
    </ButtonContainer>
  );
};
