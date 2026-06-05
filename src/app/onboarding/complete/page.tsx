"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styled from "styled-components";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { tryRefreshToken } from "@/shared/lib/api/client";
import { useToast } from "@/context/ToastContext";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  // 회원가입 직후 보유한 토큰을 refresh로 정식 로그인 세션으로 교체한 뒤 홈으로 이동한다.
  // (홈 진입 시 ClientLayout이 세션을 재검증하므로, 여기서 미리 세션을 확립해 튕김을 방지)
  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    const token = await tryRefreshToken();
    if (token) {
      router.push("/home");
    } else {
      setIsStarting(false);
      showToast("로그인에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  return (
    <PageContainer>
      <Body>
        <Content>
          <Header>
            <TitleText>만남 준비 완료!</TitleText>
            <SubtitleText>
              희박한 확률 속에서<br />
              나와 닮은 누군가를 찾아보세요.<br />
              첫 번째 퀴즈가 당신을 기다리고 있어요.
            </SubtitleText>
          </Header>
          <IllustrationWrapper>
            <Image
              src="/assets/illustration/9.svg"
              alt="온보딩 완료 일러스트"
              width={280}
              height={280}
              priority
            />
          </IllustrationWrapper>
        </Content>
        <ActionArea>
          <GradientFade />
          <ActionSheet>
            <ActionButton
              variant={isStarting ? "disabled" : "primary"}
              disabled={isStarting}
              onClick={handleStart}
            >
              시작하기
            </ActionButton>
          </ActionSheet>
        </ActionArea>
      </Body>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
  overflow: hidden;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0 0;
  min-height: 0;
  width: 100%;
  position: relative;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1 0 0;
  min-height: 0;
  padding: 0;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  padding: 12px 16px 0;
  width: 100%;
`;

const TitleText = styled.h1`
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-semantic-label-normal);
  text-align: center;
  margin: 0;
`;

const SubtitleText = styled.p`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
  text-align: center;
  margin: 0;
`;

const IllustrationWrapper = styled.div`
  width: 280px;
  height: 280px;
  flex-shrink: 0;
  position: relative;
`;

const ActionArea = styled.div`
  flex-shrink: 0;
  width: 100%;
  position: relative;
`;

const GradientFade = styled.div`
  height: 16px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--color-semantic-background-normal-normal)
  );
`;
