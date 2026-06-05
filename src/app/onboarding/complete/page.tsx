"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styled from "styled-components";
import { ActionButton, ActionSheet } from "@/components/input/Action";

export default function OnboardingCompletePage() {
  const router = useRouter();

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
            <ActionButton variant="primary" onClick={() => router.push("/home")}>
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
  padding: 0 16px;
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
