"use client";

import { Headline1 } from "@/components/common/Text";
import { useRouter } from "next/navigation";
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
  background-color: transparent; 
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const DevButtonContainer = styled(ButtonContainer)`
  border: 2px dashed #e67e22;
  background-color: rgba(230, 126, 34, 0.08);
  margin-top: 12px;
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

const isLocalDev = () => {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

interface KakaoLoginProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoginComplete?: (result: any) => void;
}

export const KakaoLogin = ({ onLoginComplete }: KakaoLoginProps) => {
  const router = useRouter();

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

  const handleDevLogin = () => {
    // 개발 모드 전용: 더미 카카오 데이터로 회원가입 플로우 시작
    if (onLoginComplete) {
      onLoginComplete({
        isRegistered: false,
        kakaoId: 9999999999,
        nickname: "개발자",
        profileImage: "m1",
        email: "dev@localhost.com",
        gender: "male",
      });
    } else {
      // fallback: onLoginComplete이 없으면 직접 /home으로
      localStorage.setItem("accessToken", "dev-bypass-token");
      localStorage.setItem("refreshToken", "dev-bypass-refresh");
      router.push("/home");
    }
  };

  return (
    <>
      <ButtonContainer onClick={handleLogin}>
        <ButtonInnerContainer>
          <img src="/assets/logo/kakao.svg" alt="Kakao Logo" />
          <Headline1 $weight="semibold">카카오로 계속하기</Headline1>
        </ButtonInnerContainer>
      </ButtonContainer>

      {isLocalDev() && (
        <DevButtonContainer onClick={handleDevLogin}>
          <ButtonInnerContainer>
            <span style={{ fontSize: 18 }}>🔧</span>
            <Headline1 $weight="semibold">개발 모드 로그인</Headline1>
          </ButtonInnerContainer>
        </DevButtonContainer>
      )}
    </>
  );
};