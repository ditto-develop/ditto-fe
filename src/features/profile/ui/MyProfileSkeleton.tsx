"use client";

import styled from "styled-components";

import { SkeletonBlock } from "@/shared/ui";

/**
 * 내 프로필의 로딩 자리.
 *
 * 여백·카드 shell은 MyProfileContainer의 Content/Header/ActionRow/CardStack에서
 * 그대로 가져왔다. 실루엣이 어긋나면 실제 콘텐츠가 들어올 때 화면이 밀린다.
 */
export function MyProfileSkeleton() {
    return (
        <Content aria-hidden="true" data-cy="my-profile-skeleton">
            <Header>
                <SkeletonBlock $width="100px" $height="100px" $circle />
                <NameGroup>
                    <SkeletonBlock $width="140px" $height="26px" />
                    <SkeletonBlock $width="180px" $height="20px" />
                </NameGroup>
            </Header>

            <ActionRow>
                <SkeletonBlock $width="100%" $height="40px" $radius="10px" />
                <SkeletonBlock $width="100%" $height="40px" $radius="10px" />
            </ActionRow>

            <CardStack>
                <IntroCardSkeleton />
                <MyProfileCardsSkeleton />
            </CardStack>
        </Content>
    );
}

/**
 * 통계 · 받은 평가 카드의 로딩 자리.
 *
 * 이 두 카드는 프로필과 별개 요청이라 프로필이 먼저 뜬다. 그 사이 기본값 0이 보였다가
 * 실제 값으로 바뀌는 두 번째 깜빡임이 생기므로, 응답 전까지는 카드도 스켈레톤으로 둔다.
 */
export function MyProfileCardsSkeleton() {
    return (
        <>
            <StatsCard aria-hidden="true">
                <SkeletonBlock $width="56px" $height="18px" />
                <StatsGrid>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <StatItem key={index}>
                            <SkeletonBlock $width="32px" $height="28px" />
                            <SkeletonBlock $width="52px" $height="16px" />
                        </StatItem>
                    ))}
                </StatsGrid>
            </StatsCard>

            <RatingsCard aria-hidden="true">
                <SkeletonBlock $width="64px" $height="18px" />
                <SkeletonBlock $width="132px" $height="24px" />
                <ChipRow>
                    <SkeletonBlock $width="88px" $height="28px" $radius="var(--space-2)" />
                    <SkeletonBlock $width="72px" $height="28px" $radius="var(--space-2)" />
                </ChipRow>
            </RatingsCard>
        </>
    );
}

function IntroCardSkeleton() {
    return (
        <IntroCard aria-hidden="true">
            <SkeletonBlock $width="72px" $height="18px" />
            <SkeletonBlock $width="100%" $height="20px" />
            <SkeletonBlock $width="60%" $height="20px" />
        </IntroCard>
    );
}

const Content = styled.div`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
`;

const NameGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
`;

const ActionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-8);
`;

const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4);
`;

const IntroCard = styled.section`
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  padding: var(--space-8) var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const StatsCard = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-4);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2px);
`;

const RatingsCard = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-4) var(--space-4) var(--space-5);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;
