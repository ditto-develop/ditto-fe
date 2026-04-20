"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { FullScreenModal } from "@/shared/ui";
import { Nav } from "@/shared/ui";
import { BottomSheet } from "@/shared/ui";
import { ProfileDetailModal } from "@/components/home/ProfileDetailModal";
import { AlertModal } from "@/shared/ui";
import {
  Heading2Bold,
  Body2Normal,
  Caption2,
  Label2,
  Headline2,
  Caption1,
} from "@/shared/ui";
import type { AlertStatus } from "@/components/display/Card";
import type { MatchCandidateDto} from "@/features/matching/api/matchingApi";
import { joinGroupMatch, declineGroupMatch } from "@/features/matching/api/matchingApi";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { ProfileImg, ProfileWrapper } from "@/components/onboarding/OnboardingContainer";
import { ActionButton } from "@/components/input/Action";
import { useToast } from "@/context/ToastContext";

// ---- Helpers ----

function getAvatarUrl(gender: string, index: number = 0): string {
  if (gender === "FEMALE") return `/assets/avatar/f${(index % 3) + 1}.png`;
  return `/assets/avatar/m${(index % 3) + 1}.png`;
}

function formatGender(gender: string): string {
  return gender === "FEMALE" ? "여성" : "남성";
}

function getMatchBadgeInfo(count: number): { badge: string; color: AlertStatus } {
  if (count >= 11) return { badge: "🌟 당신과 가장 비슷해요", color: "destructive" };
  if (count >= 8) return { badge: "😊 대부분 비슷하게 생각해요", color: "destructive" };
  if (count >= 6) return { badge: "🙂 비슷하지만 새로운 관점도 있어요", color: "cautionary" };
  return { badge: "👀 다르게 생각하는 편이에요", color: "navy" };
}

function getBadgeTextColor(status: AlertStatus): string {
  switch (status) {
    case "cautionary": return "var(--color-semantic-status-cautionary)";
    case "navy": return "var(--color-semantic-accent-foreground-Navy)";
    case "destructive":
    default: return "var(--color-semantic-status-negative)";
  }
}

function getBadgeBgColor(status: AlertStatus): string {
  switch (status) {
    case "cautionary": return "rgba(192, 110, 28, 0.08)";
    case "navy": return "rgba(55, 96, 126, 0.08)";
    case "destructive":
    default: return "rgba(179, 53, 40, 0.08)";
  }
}

function toProfileDetail(c: MatchCandidateDto, index: number) {
  const badge = getMatchBadgeInfo(c.scoreBreakdown?.matchedQuestions ?? 0);
  return {
    id: c.userId,
    name: c.nickname,
    ageRange: formatAgeRange(c.age),
    gender: formatGender(c.gender),
    location: c.location ?? "",
    bio: c.introduction ?? "",
    matchCount: c.scoreBreakdown?.matchedQuestions ?? 0,
    totalQuestions: c.scoreBreakdown?.totalQuestions ?? 12,
    avatarUrl: getAvatarUrl(c.gender, index),
    badgeText: badge.badge,
    badgeColor: badge.color,
  };
}

// ---- Types ----

interface GroupMatchingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecline?: () => void;
  onJoinSuccess?: () => void;
  onJoinPending?: () => void;
  joinPending?: boolean;
  candidates: MatchCandidateDto[];
  quizSetId: string;
  groupName?: string;
}

// ---- Component ----

export function GroupMatchingResultModal({
  isOpen,
  onClose,
  onDecline,
  onJoinSuccess,
  onJoinPending,
  joinPending = false,
  candidates,
  groupName = "같은 취미, 취향 그룹",
}: GroupMatchingResultModalProps) {
  console.log('[src/components/home/GroupMatchingResultModal.tsx] GroupMatchingResultModal'); // __component_log__
  const { showToast, removeToast } = useToast();
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<{ participantCount: number; isActive: boolean } | null>(
    joinPending ? { participantCount: 0, isActive: false } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [profileSelect, setProfileSelect] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ReturnType<typeof toProfileDetail> | null>(null);
  const [rejectAlertOpen, setRejectAlertOpen] = useState(false);
  const [joinConfirmOpen, setJoinConfirmOpen] = useState(false);

  const avgMatched = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + (c.scoreBreakdown?.matchedQuestions ?? 0), 0) / candidates.length)
    : 0;
  const totalQ = candidates[0]?.scoreBreakdown?.totalQuestions ?? 12;
  const topBadge = getMatchBadgeInfo(candidates[0]?.scoreBreakdown?.matchedQuestions ?? 0);

  const shown = candidates.slice(0, 3);
  const extra = candidates.length - 3;

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      const result = await joinGroupMatch();
      setJoinResult({ participantCount: result.participantCount, isActive: result.isActive });

      if (result.isActive) {
        const toastId = `group-join-active-${Date.now()}`;
        showToast("그룹에 참여했어요! 대화는 금요일에 시작 돼요", "default", {
          id: toastId,
          actionLabel: "확인",
          onAction: () => removeToast(toastId),
          duration: 3000,
        });
        onClose();
        onJoinSuccess?.();
      } else {
        showToast(
          "그룹 참여를 신청했어요. 3명 이상이 참여하면 금요일에 대화가 시작돼요.",
          "default",
          { duration: 3000 }
        );
        onJoinPending?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "참여 중 오류가 발생했습니다.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <FullScreenModal isOpen={isOpen} onClose={onClose}>
        <Nav prev={onClose} />

        <HeaderContainer>
          <MatchTypeRow>
            <img src="/icons/content/people.svg" alt="" width={16} height={16} />
            <Caption2 $color="var(--color-semantic-accent-foreground-vintage-green)">
              그룹 매칭
            </Caption2>
          </MatchTypeRow>
          <ResultTitle>
            이번 주 매칭 결과
          </ResultTitle>
          <ResultDescription $color="var(--color-semantic-label-neutral)">
            나와 비슷한 답을 한 사람들을 찾았어요.{"\n"}
            3명 이상이 참여해야 대화가 시작돼요.
          </ResultDescription>
        </HeaderContainer>

        <ContentBody>
          {candidates.length === 0 ? (
            <EmptyState>
              <EmptyStateImage src="/assets/illustration/empty-state.png" alt="" />
              <EmptyStateText $color="var(--color-semantic-label-alternative)">
                아직 충분한 참여자가 없어요.{"\n"}다음 주를 기대해 주세요!
              </EmptyStateText>
            </EmptyState>
          ) : (
            /* Figma 1310:35990 — 뱃지행 + 그룹 카드 */
            <CardWrapper>
              <BadgeRow>
                <Badge $bgColor={getBadgeBgColor(topBadge.color)}>
                  <Caption1 $color={getBadgeTextColor(topBadge.color)}>
                    {topBadge.badge}
                  </Caption1>
                </Badge>
                <Caption2 $color="var(--color-semantic-label-alternative)">
                  {totalQ}개중 평균 {avgMatched}개 일치
                </Caption2>
              </BadgeRow>

              {/* Figma 1310:35601 — 그룹 카드 (tappable) */}
              <GroupCard onClick={!joinResult ? () => setProfileSelect(true) : undefined} $joined={!!joinResult}>
                <AvatarGrid>
                  {shown.map((c, i) => (
                    <AvatarSlot key={c.userId}>
                      <FullSizeProfileImg
                        imageUrl={getAvatarUrl(c.gender, i)}
                      />
                    </AvatarSlot>
                  ))}
                  {extra > 0 ? (
                    <PlusBadge>
                      <Caption1 $color="white" $weight="bold">+{extra}</Caption1>
                    </PlusBadge>
                  ) : shown.length < 4 ? (
                    <HiddenAvatarSlot />
                  ) : null}
                </AvatarGrid>

                <GroupInfo>
                  <Headline2>{groupName}</Headline2>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    {candidates[0].nickname}님 외 {candidates.length - 1}명
                  </Label2>
                  {joinResult && !joinResult.isActive && (
                    <JoinedRow>
                      <img
                        src="/icons/status/circle-check-fill.svg"
                        alt=""
                        width={14}
                        height={14}
                      />
                      <Caption1 $color="var(--color-semantic-label-neutral)">
                        그룹 참여를 신청했어요
                      </Caption1>
                    </JoinedRow>
                  )}
                </GroupInfo>

                {!joinResult && (
                  <ChevronIcon
                    src="/icons/navigation/chevron-right.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                )}
              </GroupCard>
            </CardWrapper>
          )}

          {error && (
            <FeedbackBox $isError>
              <Body2Normal $color="var(--color-semantic-status-negative)">{error}</Body2Normal>
            </FeedbackBox>
          )}
        </ContentBody>

        {candidates.length > 0 && (
          <BottomActions>
            <ActionRow>
              <EqualActionButton
                variant={joinResult ? "disabled" : "secondary"}
                onClick={!joinResult ? () => setRejectAlertOpen(true) : undefined}
              >
                거절하기
              </EqualActionButton>
              <EqualActionButton
                variant={joinResult ? "disabled" : "primary"}
                onClick={!joinResult && !joining ? () => setJoinConfirmOpen(true) : undefined}
              >
                {joining ? "참여 중..." : "참여하기"}
              </EqualActionButton>
            </ActionRow>
          </BottomActions>
        )}
      </FullScreenModal>

      {/* 프로필 선택 BottomSheet — Figma 1347:14821 */}
      {profileSelect && (
        <BottomSheet
          title="프로필 선택"
          detail={
            <MemberListScroll>
              {candidates.map((c, i) => {
                const badge = getMatchBadgeInfo(c.scoreBreakdown?.matchedQuestions ?? 0);
                const total = c.scoreBreakdown?.totalQuestions ?? 12;
                const matched = c.scoreBreakdown?.matchedQuestions ?? 0;
                return (
                  <MemberItem
                    key={c.userId}
                    onClick={() => setSelectedProfile(toProfileDetail(c, i))}
                  >
                    <MemberBadgeRow>
                      <InlineBadge $bgColor={getBadgeBgColor(badge.color)}>
                        <Caption1 $color={getBadgeTextColor(badge.color)}>{badge.badge}</Caption1>
                      </InlineBadge>
                      <Caption1 $color="var(--color-semantic-label-alternative)">
                        {total}개중 {matched}개 일치
                      </Caption1>
                    </MemberBadgeRow>
                    <MemberCard>
                      <ProfileWrapper>
                        <ProfileImg imageUrl={getAvatarUrl(c.gender, i)} />
                      </ProfileWrapper>
                      <MemberTextInfo>
                        <Headline2>{c.nickname}</Headline2>
                        <Label2 $color="var(--color-semantic-label-alternative)">
                          {formatAgeRange(c.age)} · {formatGender(c.gender)}{c.location ? ` · ${c.location}` : ""}
                        </Label2>
                        {c.introduction && (
                          <Label2 $color="var(--color-semantic-label-alternative)">
                            {c.introduction}
                          </Label2>
                        )}
                      </MemberTextInfo>
                      <ChevronIcon
                        src="/icons/navigation/chevron-right.svg"
                        alt=""
                        width={24}
                        height={24}
                      />
                    </MemberCard>
                  </MemberItem>
                );
              })}
            </MemberListScroll>
          }
          closer={() => setProfileSelect(false)}
        />
      )}

      <ProfileDetailModal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        profile={selectedProfile}
        hideCta
      />

      <AlertModal
        isOpen={rejectAlertOpen}
        title="그룹 참여를 거절할까요?"
        message="거절하면 이번 주 그룹 대화에는 참여할 수 없습니다."
        confirmParams={{
          text: "네, 거절할게요",
          onClick: async () => {
            setRejectAlertOpen(false);
            try { await declineGroupMatch(); } catch { /* ignore */ }
            onClose();
            onDecline?.();
          },
        }}
        cancelParams={{
          text: "아니요",
          onClick: () => setRejectAlertOpen(false),
        }}
        onClose={() => setRejectAlertOpen(false)}
      />

      <AlertModal
        isOpen={joinConfirmOpen}
        title="이 그룹에 참여할까요?"
        message="한 번 참여하기를 선택하면 취소할 수 없어요."
        confirmParams={{
          text: "네, 참여할게요",
          onClick: () => {
            setJoinConfirmOpen(false);
            handleJoin();
          },
        }}
        cancelParams={{
          text: "아니요",
          onClick: () => setJoinConfirmOpen(false),
        }}
        onClose={() => setJoinConfirmOpen(false)}
      />
    </>
  );
}

// ---- Styled Components ----

const HeaderContainer = styled.div`
  padding: 0 16px 16px 16px;
  background-color: var(--color-semantic-background-normal-normal);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
`;

const MatchTypeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ResultTitle = styled(Heading2Bold)`
  font-size: var(--typography-title-3-font-size);
  margin: 4px 0 8px 0;
`;

const ResultDescription = styled(Body2Normal)`
  white-space: pre-wrap;
`;

const ContentBody = styled.div`
  flex: 1;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-bottom: 120px;
  background-color: var(--color-semantic-background-normal-normal);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
`;

const EmptyStateImage = styled.img`
  width: 120px;
  height: 120px;
`;

const EmptyStateText = styled(Body2Normal)`
  text-align: center;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BadgeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Badge = styled.div<{ $bgColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  height: 24px;
  border-radius: 6px;
  background-color: ${({ $bgColor }) => $bgColor};
`;

/* Figma 1310:35601 */
const GroupCard = styled.div<{ $joined?: boolean }>`
  background-color: var(--color-semantic-fill-normal);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: ${({ $joined }) => ($joined ? "default" : "pointer")};
`;

const JoinedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
`;

/* Figma 1310:35608 — 80×80, 2×2 grid, no gap */
const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 40px);
  grid-template-rows: repeat(2, 40px);
  width: 80px;
  height: 80px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
`;

const AvatarSlot = styled.div`
  width: 40px;
  height: 40px;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-alternative);
`;

const HiddenAvatarSlot = styled(AvatarSlot)`
  opacity: 0;
`;

const FullSizeProfileImg = styled(ProfileImg)`
  width: 100%;
  height: 100%;
`;

/* Figma 1310:35612 */
const PlusBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(26, 24, 21, 0.35);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GroupInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const FeedbackBox = styled.div<{ $isError?: boolean }>`
  padding: 12px 16px;
  border-radius: 12px;
  background-color: ${({ $isError }) =>
    $isError ? "rgba(179, 53, 40, 0.08)" : "rgba(85, 122, 85, 0.08)"};
`;

const BottomActions = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: var(--color-semantic-background-normal-normal);
  border-top: 1px solid var(--color-semantic-line-normal-normal);
  z-index: 10;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
`;

const EqualActionButton = styled(ActionButton)`
  flex: 1;
`;

const ChevronIcon = styled.img`
  opacity: 0.3;
  flex-shrink: 0;
`;

/* BottomSheet 내부 — Figma 1347:14821 */
const MemberListScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 510px;
  overflow-y: auto;
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const MemberItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
`;

const MemberBadgeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const InlineBadge = styled.div<{ $bgColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  height: 24px;
  border-radius: 6px;
  background-color: ${({ $bgColor }) => $bgColor};
`;

const MemberCard = styled.div`
  width: 100%;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--color-semantic-fill-normal);
  box-sizing: border-box;
`;

const MemberTextInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
