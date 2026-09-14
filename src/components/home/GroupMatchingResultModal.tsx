"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { trackEvent } from "@/shared/lib/analytics";
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
import type { GroupCandidateGroupDto, MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { acceptGroupMatch, declineGroupMatch } from "@/features/matching/api/matchingApi";
import { API_ERROR_CODE, hasApiErrorCode } from "@/shared/lib/api/apiError";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { toLocationLabel } from "@/shared/lib/profileLabels";
import { ProfileImg, ProfileWrapper } from "@/components/onboarding/OnboardingContainer";
import { ActionButton } from "@/components/input/Action";
import { useToast } from "@/context/ToastContext";
import { formatGender, getAvatarUrl, getMatchBadgeInfo } from "@/components/home/_parts/MatchingDay.helpers";

// ---- Helpers ----

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

/**
 * 내 화면이 서버와 어긋났다는 신호. 다른 탭·기기에서 먼저 응답했을 때 온다.
 * 에러로 띄우지 않고 후보 목록을 다시 받아 화면을 맞춘다
 * (BE 위키 Frontend-Group-Matching-Guide §에러 코드).
 */
function isStaleGroupError(error: unknown): boolean {
  return hasApiErrorCode(
    error,
    API_ERROR_CODE.FORBIDDEN,              // 0003 — 내가 후보가 아닌 그룹
    API_ERROR_CODE.NOT_FOUND,              // 0004 — 없는 그룹
    API_ERROR_CODE.GROUP_ALREADY_ACCEPTED, // 5005
    API_ERROR_CODE.GROUP_ALREADY_DECLINED, // 5006 (자동 거절 포함)
  );
}

function toProfileDetail(c: MatchCandidateDto, index: number) {
  const badge = getMatchBadgeInfo(
    c.scoreBreakdown?.matchedQuestions ?? 0,
    c.scoreBreakdown?.totalQuestions ?? 12
  );
  return {
    id: c.userId,
    name: c.nickname,
    ageRange: formatAgeRange(c.age),
    gender: formatGender(c.gender),
    location: c.location ? toLocationLabel(c.location) : "",
    bio: c.introduction ?? "",
    matchCount: c.scoreBreakdown?.matchedQuestions ?? 0,
    totalQuestions: c.scoreBreakdown?.totalQuestions ?? 12,
    avatarUrl: c.profileImageUrl || getAvatarUrl(c.gender, index),
    badgeText: badge.badge,
    badgeColor: badge.color,
  };
}

// ---- Types ----

interface GroupMatchingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 응답 대상 후보 그룹. 수락·거절은 퀴즈셋이 아니라 `groupMatchId`로 보낸다. */
  group: GroupCandidateGroupDto;
  /** 수락 성공. isFormed 면 이번 수락으로 성사됐거나 이미 성사된 그룹이다. */
  onAccepted: (isFormed: boolean) => void;
  onDeclined: () => void;
  /** 서버와 어긋남(0003/0004/5005/5006) — 후보 목록 재조회를 요청한다. */
  onStale: () => void;
  groupName?: string;
}

// ---- Component ----

export function GroupMatchingResultModal({
  isOpen,
  onClose,
  group,
  onAccepted,
  onDeclined,
  onStale,
  groupName = "같은 취미, 취향 그룹",
}: GroupMatchingResultModalProps) {
  const { showToast, removeToast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileSelect, setProfileSelect] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ReturnType<typeof toProfileDetail> | null>(null);
  const [rejectAlertOpen, setRejectAlertOpen] = useState(false);
  const [joinConfirmOpen, setJoinConfirmOpen] = useState(false);

  const candidates = group.members;

  /**
   * 화면에 뜨는 점수는 두 가지다. 그룹 카드는 **나와 각 구성원의 일치 수 평균**
   * (`averageMatchedQuestions`), 프로필 목록은 구성원 개인의 `matchedQuestions` 다.
   * 평균은 서버가 조회 시점에 계산해 내려 주므로 여기서 다시 구하지 않는다.
   */
  const avgMatched = group.averageMatchedQuestions;
  const totalQ = group.totalQuestions;
  const topBadge = getMatchBadgeInfo(avgMatched, totalQ);

  /** 수락은 했지만 아직 성사 전(수락자 3명 미만). 응답을 끝낸 상태라 버튼은 잠긴다. */
  const awaitingFormation = group.myStatus === "ACCEPTED";

  const shown = candidates.slice(0, 3);
  const extra = candidates.length - 3;

  /** 서버가 이미 다른 상태다 — 에러 대신 최신 목록으로 화면을 맞춘다. */
  const handleStale = () => {
    showToast("이미 응답한 그룹이에요. 최신 결과를 다시 불러올게요.", "default", { duration: 3000 });
    onClose();
    onStale();
  };

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptGroupMatch(group.groupMatchId);
      trackEvent("group_match_join", { ok: true });
      onAccepted(result.isFormed);

      if (result.isFormed) {
        const toastId = `group-join-active-${Date.now()}`;
        showToast("그룹에 참여했어요! 대화는 금요일에 시작 돼요", "default", {
          id: toastId,
          actionLabel: "확인",
          onAction: () => removeToast(toastId),
          duration: 3000,
        });
        onClose();
      } else {
        showToast(
          "그룹 참여를 신청했어요. 3명 이상이 참여하면 금요일에 대화가 시작돼요.",
          "default",
          { duration: 3000 }
        );
      }
    } catch (e) {
      // 실패도 센다. 여기가 크면 "참여가 안 된다"는 이탈이 흥미 상실로 오독된다.
      trackEvent("group_match_join", { ok: false });
      if (isStaleGroupError(e)) {
        handleStale();
        return;
      }
      setError(e instanceof Error ? e.message : "참여 중 오류가 발생했습니다.");
    } finally {
      setAccepting(false);
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
            나와 가장 비슷한 답을 한 사람들을 찾았어요.{"\n"}
            3명 이상이 참여하면 대화를 나눌 수 있어요.
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
              <GroupCard onClick={!awaitingFormation ? () => setProfileSelect(true) : undefined} $joined={awaitingFormation}>
                <AvatarGrid>
                  {shown.map((c, i) => (
                    <AvatarSlot key={c.userId}>
                      <FullSizeProfileImg
                        imageUrl={c.profileImageUrl || getAvatarUrl(c.gender, i)}
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

                <GroupContent>
                  <GroupInfo>
                    <Headline2>{groupName}</Headline2>
                    <Label2 $color="var(--color-semantic-label-alternative)">
                      {candidates[0].nickname}님 외 {candidates.length - 1}명
                    </Label2>
                  </GroupInfo>

                  {awaitingFormation && (
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
                </GroupContent>

                {!awaitingFormation && (
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
                variant={awaitingFormation ? "disabled" : "secondary"}
                onClick={!awaitingFormation ? () => setRejectAlertOpen(true) : undefined}
              >
                거절하기
              </EqualActionButton>
              <EqualActionButton
                variant={awaitingFormation ? "disabled" : "primary"}
                onClick={!awaitingFormation && !accepting ? () => setJoinConfirmOpen(true) : undefined}
              >
                {accepting ? "참여 중..." : "참여하기"}
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
                const total = c.scoreBreakdown?.totalQuestions ?? 12;
                const matched = c.scoreBreakdown?.matchedQuestions ?? 0;
                const badge = getMatchBadgeInfo(matched, total);
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
                        <ProfileImg imageUrl={c.profileImageUrl || getAvatarUrl(c.gender, i)} />
                      </ProfileWrapper>
                      <MemberTextInfo>
                        <Headline2>{c.nickname}</Headline2>
                        <Label2 $color="var(--color-semantic-label-alternative)">
                          {formatAgeRange(c.age)} · {formatGender(c.gender)}{c.location ? ` · ${toLocationLabel(c.location)}` : ""}
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
            trackEvent("group_match_decline", {});
            try {
              await declineGroupMatch(group.groupMatchId);
            } catch (e: unknown) {
              if (isStaleGroupError(e)) {
                handleStale();
                return;
              }
              // 그 밖의 실패는 화면을 막지 않는다 — 다음 후보로 넘긴다.
            }
            onClose();
            onDeclined();
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
            handleAccept();
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

const GroupContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

const JoinedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  align-self: flex-end;
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
  /* viewport 고정 하단 바. BottomActionArea와 동일한 인셋 규칙을 따른다. */
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
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
