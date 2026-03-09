"use client";

import styled from "styled-components";
import { TopNavigation } from "@/shared/ui/TopNavigation";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { ContentBadge } from "@/shared/ui/ContentBadge";
import { Avatar } from "@/shared/ui/Avatar";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";
import { getMatchBadgeInfo, type MatchProfile } from "@/features/matching";
import { useMatchCandidates, type MatchItem } from "@/features/matching/hooks/useMatchCandidates";
import type { IntroNoteState } from "@/features/profile";

export interface ProfileClickInfo {
    userId: string;
    quizSetId: string;
    matchRequestId?: string;
    state: IntroNoteState;
}

/**
 * MatchProfileCard — Figma: 매칭 카드 1장
 * Avatar(80px) + 닉네임/나이/성별/지역/한줄소개 + 대화 상태
 */
function MatchProfileCard({ profile }: { profile: MatchProfile }) {
  console.log('[src/features/matching/containers/MatchingResultContainer.tsx] MatchProfileCard'); // __component_log__
    return (
        <CardRow>
            <Avatar src={profile.avatarUrl} size="lg" />
            <CardInfo>
                <CardNickname>{profile.nickname}</CardNickname>
                <CardMeta>
                    {profile.age}세 · {profile.gender}
                    {profile.location ? ` · ${profile.location}` : ""}
                </CardMeta>
                <CardBio>{profile.bio}</CardBio>
            </CardInfo>
            <ChevronIcon src="/icons/navigation/chevron-right.svg" alt="detail" />
        </CardRow>
    );
}

/**
 * MatchingResultContainer — Figma: 3.1 매칭 결과 1:1
 * 실제 API 연결 + 피그마 UI
 */
export default function MatchingResultContainer({
    onBack,
    onProfileClick,
}: {
    onBack: () => void;
    onProfileClick: (info: ProfileClickInfo) => void;
}) {
  console.log('[src/features/matching/containers/MatchingResultContainer.tsx] MatchingResultContainer'); // __component_log__
    const { quizSetId, candidates, loading, error } = useMatchCandidates();

    const grouped = groupByMatchRate(candidates);

    return (
        <PageContainer>
            <TopNavigation onBack={onBack} />

            <Header>
                <MatchLabel>
                    <MatchIcon src="/icons/content/people.svg" alt="" />
                    <MatchLabelText>1:1 매칭</MatchLabelText>
                </MatchLabel>
                <SectionHeader title="이번 주 매칭 결과" />
                <HeaderDescription>
                    나와 가장 비슷한 답을 한 사람들을 찾았어요.{"\n"}
                    서로를 선택한 단 한사람과 대화를 나눌 수 있어요.
                </HeaderDescription>
            </Header>

            <Body>
                {loading && <StateText>매칭 결과를 불러오는 중...</StateText>}
                {error && <StateText>매칭 결과를 불러오지 못했어요.</StateText>}
                {!loading && !error && grouped.length === 0 && (
                    <StateText>이번 주 매칭 결과가 없어요.</StateText>
                )}

                {grouped.map((group) => (
                    <MatchGroup key={group.badge.label}>
                        <BadgeRow>
                            <ContentBadge variant={group.badge.variant} icon="">
                                {group.badge.label}
                            </ContentBadge>
                            <MatchCount>{group.badge.matchDescription}</MatchCount>
                        </BadgeRow>

                        {group.matches.map((match) => (
                            <SurfaceCard
                                key={match.profile.id}
                                onClick={() =>
                                    onProfileClick({
                                        userId: match.profile.id,
                                        quizSetId,
                                        matchRequestId: match.matchRequestId,
                                        state: match.hasReceivedRequest
                                            ? "after_acceptance"
                                            : "before_request",
                                    })
                                }
                            >
                                <MatchProfileCard profile={match.profile} />
                                {match.hasReceivedRequest && (
                                    <StatusRow>
                                        <StatusIcon>▸</StatusIcon>
                                        <StatusText $green>상대가 대화를 신청했어요</StatusText>
                                    </StatusRow>
                                )}
                                {match.hasRequested && (
                                    <StatusRow>
                                        <StatusCheck>✓</StatusCheck>
                                        <StatusText>내가 대화를 신청했어요</StatusText>
                                    </StatusRow>
                                )}
                            </SurfaceCard>
                        ))}
                    </MatchGroup>
                ))}
            </Body>
        </PageContainer>
    );
}

// --- Helpers ---

function groupByMatchRate(matches: MatchItem[]) {
    const sorted = [...matches].sort((a, b) => b.matchRate - a.matchRate);
    const groups: Array<{ badge: ReturnType<typeof getMatchBadgeInfo>; matches: MatchItem[] }> = [];

    for (const match of sorted) {
        const badge = getMatchBadgeInfo(match.matchRate);
        const existingGroup = groups.find((g) => g.badge.label === badge.label);
        if (existingGroup) {
            existingGroup.matches.push(match);
        } else {
            groups.push({ badge, matches: [match] });
        }
    }

    return groups;
}

// --- Styled Components ---
const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-semantic-background-normal-alternative, #E9E6E2);
`;

const Header = styled.div`
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MatchLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MatchIcon = styled.img`
  width: 16px;
  height: 16px;
`;

const MatchLabelText = styled.span`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-semantic-label-alternative);
  white-space: pre-line;
`;

const Body = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const MatchGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BadgeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const MatchCount = styled.span`
  font-size: 12px;
  color: var(--color-semantic-label-alternative);
`;

const CardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const CardInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardNickname = styled.span`
  font-size: 17px;
  font-weight: 700;
  color: var(--color-semantic-label-strong);
`;

const CardMeta = styled.span`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
`;

const CardBio = styled.span`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
`;

const ChevronIcon = styled.img`
  width: 24px;
  height: 24px;
  opacity: 0.3;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const StatusIcon = styled.span`
  font-size: 12px;
  color: var(--color-semantic-status-positive);
`;

const StatusCheck = styled.span`
  font-size: 12px;
  color: var(--color-semantic-label-alternative);
`;

const StatusText = styled.span<{ $green?: boolean }>`
  font-size: 12px;
  color: ${({ $green }) =>
      $green
          ? "var(--color-semantic-status-positive)"
          : "var(--color-semantic-label-alternative)"};
`;

const StateText = styled.p`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
`;
