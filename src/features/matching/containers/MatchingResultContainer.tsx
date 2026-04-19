"use client";

import styled from "styled-components";
import { TopNavigation } from "@/shared/ui";
import { SectionHeader } from "@/shared/ui";
import { ContentBadge } from "@/shared/ui";
import { Avatar } from "@/shared/ui";
import { SurfaceCard } from "@/shared/ui";
import { getMatchBadgeInfo, type MatchProfile } from "@/features/matching";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { useMatchCandidates } from "@/features/matching/hooks/useMatchCandidates";
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
                <CardHeader>
                    <CardNickname>{profile.nickname}</CardNickname>
                    <ChevronIcon />
                </CardHeader>
                <CardMeta>
                    {formatAgeRange(profile.age)} · {profile.gender}
                    {profile.location ? ` · ${profile.location}` : ""}
                </CardMeta>
                <CardBio>{profile.bio}</CardBio>
            </CardInfo>
        </CardRow>
    );
}

/**
 * MatchingResultContainer — Figma: 3.1 매칭 결과 1:1
 * 실제 API 연결 + 피그마 UI
 */
export function MatchingResultContainer({
    onBack,
    onProfileClick,
}: {
    onBack: () => void;
    onProfileClick: (info: ProfileClickInfo) => void;
}) {
  console.log('[src/features/matching/containers/MatchingResultContainer.tsx] MatchingResultContainer'); // __component_log__
    const { quizSetId, candidates, hasAcceptedMatch, acceptedMatchUserId, loading, error } = useMatchCandidates();

    const sorted = [...candidates].sort((a, b) => b.matchRate - a.matchRate);

    return (
        <PageContainer>
            <TopNavigation onBack={onBack} />

            <Header>
                <MatchLabel>
                    <MatchIcon />
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
                {!loading && !error && sorted.length === 0 && (
                    <StateText>이번 주 매칭 결과가 없어요.</StateText>
                )}

                {sorted.map((match) => {
                    const badge = getMatchBadgeInfo(match.matchRate);
                    return (
                        <MatchGroup key={match.profile.id}>
                            <BadgeRow>
                                <ContentBadge variant={badge.variant} icon="">
                                    {badge.label}
                                </ContentBadge>
                                <MatchCount>{badge.matchDescription}</MatchCount>
                            </BadgeRow>
                            <MatchSurfaceCard
                                onClick={() =>
                                    onProfileClick({
                                        userId: match.profile.id,
                                        quizSetId,
                                        matchRequestId: match.matchRequestId,
                                        state: hasAcceptedMatch && match.profile.id === acceptedMatchUserId
                                            ? "chat_started"
                                            : match.hasReceivedRequest
                                            ? "after_acceptance"
                                            : match.hasRequested
                                            ? "completed"
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
                            </MatchSurfaceCard>
                        </MatchGroup>
                    );
                })}
            </Body>
        </PageContainer>
    );
}

// --- Styled Components ---
const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-semantic-background-normal-normal);
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

const MatchIcon = styled.span`
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  background-color: var(--color-semantic-accent-foreground-vintagePink);
  -webkit-mask: url(/icons/content/people.svg) no-repeat center;
  mask: url(/icons/content/people.svg) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
`;

const MatchLabelText = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-accent-foreground-vintagePink);
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
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
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-label-alternative);
`;

const MatchSurfaceCard = styled(SurfaceCard)`
  background-color: var(--color-semantic-background-normal-alternative);
`;

const CardRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const CardInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const CardNickname = styled.span`
  font-size: var(--typography-headline-2-font-size);
  font-weight: 700;
  color: var(--color-semantic-label-normal);
`;

const CardMeta = styled.span`
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
`;

const CardBio = styled.span`
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
`;

const ChevronIcon = styled.span`
  display: block;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background-color: var(--color-semantic-label-assistive);
  -webkit-mask: url(/icons/navigation/chevron-right.svg) no-repeat center;
  mask: url(/icons/navigation/chevron-right.svg) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const StatusIcon = styled.span`
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-status-positive);
`;

const StatusCheck = styled.span`
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-label-alternative);
`;

const StatusText = styled.span<{ $green?: boolean }>`
  font-size: var(--typography-caption-1-font-size);
  color: ${({ $green }) =>
      $green
          ? "var(--color-semantic-status-positive)"
          : "var(--color-semantic-label-alternative)"};
`;

const StateText = styled.p`
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
`;
