"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import styled from "styled-components";
import { MainBottomNav } from "@/app/home/MainBottomNav";
import { getMyRatingSummary, getMyStats } from "@/features/profile/api/profileApi";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import type { MyRatingSummary, MyStats } from "@/features/profile/model/types";
import { ReceivedRatingsCard } from "@/features/profile/ui/ReceivedRatingsCard";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { Avatar, Button, TopNavigation } from "@/shared/ui";

export function MyProfileContainer() {
    const router = useRouter();
    const { profile, loading, error } = useMyProfile();
    const [stats, setStats] = useState<MyStats | null>(null);
    const [ratingSummary, setRatingSummary] = useState<MyRatingSummary | null>(null);

    useEffect(() => {
        Promise.all([
            getMyStats().catch(() => null),
            getMyRatingSummary().catch(() => null),
        ]).then(([nextStats, nextRatingSummary]) => {
            setStats(nextStats);
            setRatingSummary(nextRatingSummary);
        });
    }, []);

    return (
        <Page>
            <TopNavigation
                label="내 프로필"
                trailingElement={(
                    <IconButton
                        type="button"
                        aria-label="설정"
                        onClick={() => router.push("/settings")}
                    >
                        <Settings aria-hidden="true" />
                    </IconButton>
                )}
            />

            <ScrollArea>
                {loading && <StateText>프로필을 불러오는 중...</StateText>}
                {error && <StateText>프로필을 불러오지 못했어요.</StateText>}

                {profile && (
                    <Content>
                        <Header>
                            <Avatar src={profile.avatarUrl} alt={profile.nickname} size="xl" />
                            <NameGroup>
                                <Nickname>{profile.nickname}</Nickname>
                                <MetaText>
                                    {[formatAgeRange(profile.age), profile.gender, profile.location]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </MetaText>
                            </NameGroup>
                        </Header>

                        <ActionRow>
                            <ActionButton
                                $variant="outlined"
                                $size="medium"
                                onClick={() => router.push("/profile/edit")}
                            >
                                프로필 수정
                            </ActionButton>
                            <ActionButton
                                $variant="outlined"
                                $size="medium"
                                onClick={() => router.push("/profile/intro-note")}
                            >
                                소개 노트 수정
                            </ActionButton>
                        </ActionRow>

                        <CardStack>
                            <OneLineIntroCard introduction={profile.bio} />
                            <MyStatsCard stats={stats} />
                            <ReceivedRatingsCard ratingSummary={ratingSummary} />
                        </CardStack>
                    </Content>
                )}
            </ScrollArea>
            <MainBottomNav />
        </Page>
    );
}

function OneLineIntroCard({ introduction }: { introduction: string }) {
    return (
        <IntroCard>
            <TicketDeco src="/assets/decoration/deco.svg" alt="" />
            <IntroBody>
                <CardHeading>한 줄 소개</CardHeading>
                <IntroText>{introduction || "아직 한 줄 소개가 없어요."}</IntroText>
            </IntroBody>
        </IntroCard>
    );
}

function MyStatsCard({ stats }: { stats: MyStats | null }) {
    const items = [
        { label: "참여 주차", value: stats?.participationWeeks ?? 0 },
        { label: "매칭 성사", value: stats?.matchCount ?? 0 },
        { label: "만남 횟수", value: stats?.meetingCount ?? 0 },
    ];

    return (
        <StatsCard>
            <CardHeading>내 통계</CardHeading>
            <StatsGrid>
                {items.map((item) => (
                    <StatItem key={item.label}>
                        <StatValue>{item.value}</StatValue>
                        <StatLabel>{item.label}</StatLabel>
                    </StatItem>
                ))}
            </StatsGrid>
        </StatsCard>
    );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const ScrollArea = styled.main`
  min-height: calc(100dvh - var(--space-14));
  padding-bottom: calc(var(--space-20) + env(safe-area-inset-bottom));
`;

const Content = styled.div`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  box-sizing: border-box;
`;

const Header = styled.header`
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
  width: 100%;
`;

const Nickname = styled.h1`
  margin: 0;
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-semantic-label-normal);
  text-align: center;
`;

const MetaText = styled.p`
  margin: 0;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const ActionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-8);
`;

const ActionButton = styled(Button)`
  width: 100%;
`;

const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4);
`;

const IntroCard = styled.section`
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  padding: var(--space-8) var(--space-4) var(--space-6);
`;

const TicketDeco = styled.img`
  position: absolute;
  top: 0;
  left: 50%;
  width: calc(100% - var(--space-12));
  transform: translate(-50%, -50%);
`;

const IntroBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const CardHeading = styled.h2`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const IntroText = styled.p`
  margin: 0;
  font-size: var(--typography-body-1-reading-font-size);
  font-weight: var(--typography-body-1-reading-font-weight);
  line-height: var(--typography-body-1-reading-line-height);
  letter-spacing: var(--typography-body-1-reading-letter-spacing);
  color: var(--color-semantic-label-normal);
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

const StatValue = styled.strong`
  font-size: var(--typography-heading-2-font-size);
  font-weight: var(--typography-heading-2-font-weight);
  line-height: var(--typography-heading-2-line-height);
  letter-spacing: var(--typography-heading-2-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const StatLabel = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const StateText = styled.p`
  margin: 0;
  padding: var(--space-8) var(--space-4);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const IconButton = styled.button`
  width: var(--space-6);
  height: var(--space-6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-semantic-label-normal);
`;
