"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/shared/ui";
import styled from "styled-components";
import { Tutorial } from "@/components/onboarding/Tutorial";
import {
  fetchSignupInitialData,
  resolveSocialLogin,
} from "@/features/auth/lib/socialLoginOutcome";
import { debugLog } from "@/shared/lib/debugLog";
import type { KakaoLoginResult } from "@/types/kakao";

const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
`;

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 백엔드가 OAuth 전 과정을 처리한 뒤 이 경로로 리다이렉트한다.
  // 신규/기존 회원 모두 accessToken을 발급받아 저장한다.
  // - signupRequired=true → 신규 회원 → 회원가입(Tutorial)
  // - 그 외 → 기존 회원 → 로그인(/home)
  //
  // 앱의 네이티브 로그인도 토큰을 저장한 뒤 `?signupRequired=true` 로 이 화면에 들어온다.
  // 그때는 accessToken 쿼리가 없고(토큰을 URL 에 싣지 않는다) 저장된 토큰을 그대로 쓴다.
  const accessToken = searchParams.get("accessToken");
  const signupRequired = searchParams.get("signupRequired") === "true";
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  // 제재 회원은 토큰이 발급되지 않고 sanctioned=true로 리다이렉트된다.
  // 토큰 저장/회원가입 분기보다 먼저 확인해야 한다.
  const sanctioned = searchParams.get("sanctioned") === "true";
  const sanctionCode = searchParams.get("sanctionCode");
  const suspendedUntil = searchParams.get("suspendedUntil");

  // 신규 회원 진입 시 빈 initialData({})로 Tutorial step 1에서 시작
  const [initialData, setInitialData] = useState<KakaoLoginResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isHandled = useRef(false);

  useEffect(() => {
    if (isHandled.current) return;

    // 임시 진단 로그: 이 화면에 실제로 어떤 쿼리로 들어왔는지 확인한다.
    debugLog("[KakaoCallback] 쿼리 파라미터:", {
      hasAccessToken: Boolean(accessToken),
      signupRequired,
      oauthError,
      sanctioned,
      sanctionCode,
    });

    if (oauthError) {
      isHandled.current = true;
      setError(oauthErrorDescription || `카카오 로그인이 취소되었거나 실패했습니다. (${oauthError})`);
      return;
    }

    isHandled.current = true;

    // 토큰 정리·저장과 결말 분기는 네이티브 로그인과 공유한다.
    const outcome = resolveSocialLogin({
      accessToken,
      signupRequired,
      sanctioned,
      sanctionCode,
      suspendedUntil,
    });

    debugLog("[KakaoCallback] 라우팅 분기:", outcome.kind);

    if (outcome.kind === "sanctioned") {
      router.replace(`/sanction?${outcome.query}`);
      return;
    }

    if (outcome.kind === "signup") {
      // 신규 회원: 카카오 정보 기반 현재 사용자 정보(이메일/생년월일)를 받아와
      // 회원가입(Tutorial) 단계로 넘긴다. 실패해도 빈 값으로 진입은 가능하게 한다.
      void fetchSignupInitialData().then(setInitialData);
      return;
    }

    // 기존 회원: 홈으로
    router.push("/home");
  }, [
    accessToken,
    signupRequired,
    oauthError,
    oauthErrorDescription,
    sanctioned,
    sanctionCode,
    suspendedUntil,
    router,
  ]);

  if (error) {
    return (
      <LoadingContainer>
        <Body1Normal>오류가 발생했습니다:</Body1Normal>
        <Body1Normal>{error}</Body1Normal>
      </LoadingContainer>
    );
  }

  // initialData({})가 설정되면 신규 회원 → Tutorial step 1부터 시작
  if (initialData) {
    return <Tutorial initialData={initialData} />;
  }

  return (
    <LoadingContainer>
      <Body1Normal>카카오 로그인 처리 중입니다...</Body1Normal>
    </LoadingContainer>
  );
}

export function KakaoCallback() {
  return (
    <Suspense
      fallback={
        <LoadingContainer>
          <Body1Normal>페이지 로딩 중...</Body1Normal>
        </LoadingContainer>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
