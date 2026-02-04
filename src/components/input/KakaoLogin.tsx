"use client";

import { Headline1 } from "@/components/common/Text";
import styled from "styled-components";

const ButtonContainer = styled.div`
  display: flex;
  width: 361px;
  height: 48px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  border: 1px solid var(--Primary-Normal, #1a1815);
  cursor: pointer; 
  background-color: #FEE500; 
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any;
  }
}

export const KakaoLogin = () => {
  const handleLogin = () => {
    // SDK 로드 여부 방어 코드
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert("카카오 로그인을 준비 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // ✅ 리다이렉트 URI는 폴더 구조(app/oauth/kakao/page.tsx)와 일치해야 합니다.
    window.Kakao.Auth.authorize({
      redirectUri: `${window.location.origin}/oauth/kakao`,
    });
  };

  return (
    <ButtonContainer onClick={handleLogin}>
      <ButtonInnerContainer>
        <img src="/logo/kakaologo.svg" alt="Kakao Logo" />
        <Headline1 $weight="semibold">카카오로 계속하기</Headline1>
      </ButtonInnerContainer>
    </ButtonContainer>
  );
};