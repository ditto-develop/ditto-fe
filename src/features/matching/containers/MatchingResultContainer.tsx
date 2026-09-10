"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { trackEvent } from "@/shared/lib/analytics";
import { TopNavigation } from "@/shared/ui";
import { SectionHeader } from "@/shared/ui";
import { ContentBadge } from "@/shared/ui";
import { Avatar } from "@/shared/ui";
import { SurfaceCard } from "@/shared/ui";
import { SegmentedControl } from "@/shared/ui";
import { getMatchBadgeInfo, type MatchProfile } from "@/features/matching";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { useMatchCandidates } from "@/features/matching/hooks/useMatchCandidates";
import type { IntroNoteState } from "@/features/profile";

type MatchTab = "request" | "accept";

const TABS: { value: MatchTab; label: string }[] = [
    { value: "request", label: "요청하기" },
    { value: "accept", label: "수락하기" },
];

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
    const { quizSetId, candidates, hasAcceptedMatch, acceptedMatchUserId, loading, error } = useMatchCandidates();
    const [activeTab, setActiveTab] = useState<MatchTab>("request");

    /*
     * 매칭 퍼널의 분모. 화면 진입이 아니라 **후보를 실제로 받은 시점**에 센다 —
     * 조회에 실패한 진입까지 분모에 넣으면 신청률이 이유 없이 낮아 보인다.
     * 한 번만 센다: 탭 전환이나 부모 리렌더로 분모가 부풀면 안 된다.
     */
    const reportedView = useRef(false);
    useEffect(() => {
        if (loading || error || reportedView.current) return;
        reportedView.current = true;
        trackEvent("matching_result_view", { candidate_count: candidates.length });
    }, [loading, error, candidates.length]);

    const sorted = [...candidates].sort((a, b) => b.matchRate - a.matchRate);
    const requestCandidates = sorted.filter((m) => !m.hasReceivedRequest);
    const acceptCandidates = sorted.filter((m) => m.hasReceivedRequest);
    const displayCandidates = activeTab === "request" ? requestCandidates : acceptCandidates;

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
                <SegmentedControl
                    tabs={TABS}
                    value={activeTab}
                    onChange={setActiveTab}
                />
            </Header>

            <Body>
                {loading && <StateText>매칭 결과를 불러오는 중...</StateText>}
                {error && <StateText>매칭 결과를 불러오지 못했어요.</StateText>}
                {!loading && !error && displayCandidates.length === 0 && (
                    <EmptyState tab={activeTab} />
                )}

                {displayCandidates.map((match) => {
                    const badge = getMatchBadgeInfo(match.matchedQuestions, match.totalQuestions);
                    return (
                        <MatchGroup key={match.profile.id}>
                            <BadgeRow>
                                <ContentBadge variant={badge.variant} icon="">
                                    {badge.label}
                                </ContentBadge>
                                <MatchCount>{badge.matchDescription}</MatchCount>
                            </BadgeRow>
                            <MatchSurfaceCard
                                onClick={() => {
                                    const state = hasAcceptedMatch && match.profile.id === acceptedMatchUserId
                                        ? "chat_started"
                                        : match.hasReceivedRequest
                                        ? "after_acceptance"
                                        : match.hasRequested
                                        ? "completed"
                                        : "before_request";
                                    // 상대 식별자는 싣지 않는다. 관계 상태만으로 퍼널을 읽을 수 있다.
                                    trackEvent("matching_profile_open", { state });
                                    onProfileClick({
                                        userId: match.profile.id,
                                        quizSetId,
                                        matchRequestId: match.matchRequestId,
                                        state,
                                    });
                                }}
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
                                        <StatusCheckIcon src="/icons/status/circle-check-fill.svg" alt="" />
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

// --- Empty State ---
const EMPTY_STATE_CONFIG: Record<MatchTab, { title: string; description: string }> = {
    request: {
        title: "요청할 수 있는 후보가 없어요",
        description: "이번 주 매칭된 후보가 모두 나에게 먼저 연락했어요.",
    },
    accept: {
        title: "아직 받은 요청이 없어요",
        description: "나와 닮은 누군가가 용기를 내고 있을지도 몰라요.\n먼저 대화를 건네보는 건 어떨까요?",
    },
};

function EmptyState({ tab }: { tab: MatchTab }) {
    const { title, description } = EMPTY_STATE_CONFIG[tab];
    return (
        <EmptyStateWrapper>
            <EmptyContents>
                <EmptyIconSection>
                    <EmptyIconBg />
                    <EmptyIcon />
                </EmptyIconSection>
                <EmptyContent>
                    <EmptyTitle>{title}</EmptyTitle>
                    <EmptyDescription>{description}</EmptyDescription>
                </EmptyContent>
            </EmptyContents>
        </EmptyStateWrapper>
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

/* Figma 2135:22944 — 채워진 원형 체크 아이콘(글자 ✓ 가 아니라 아이콘). */
const StatusCheckIcon = styled.img`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
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

const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  width: 100%;
`;

const EmptyContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const EmptyIconSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
`;

const EmptyIconBg = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: var(--color-semantic-fill-normal);
`;

const EmptyIcon = styled.span`
  position: relative;
  display: block;
  width: 40px;
  height: 40px;
  background-color: var(--color-semantic-label-assistive);
  -webkit-mask: url(/icons/action/send.svg) no-repeat center;
  mask: url(/icons/action/send.svg) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
`;

const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  width: 100%;
  text-align: center;
`;

const EmptyTitle = styled.p`
  margin: 0;
  font-size: var(--typography-headline-1-font-size);
  font-weight: var(--typography-headline-1-font-weight);
  line-height: var(--typography-headline-1-line-height);
  letter-spacing: var(--typography-headline-1-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-reading-font-size);
  font-weight: var(--typography-body-2-reading-font-weight);
  line-height: var(--typography-body-2-reading-line-height);
  letter-spacing: var(--typography-body-2-reading-letter-spacing);
  color: var(--color-semantic-label-alternative);
  white-space: pre-line;
`;
