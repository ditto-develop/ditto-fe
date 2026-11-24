"use client";

import React, { useState } from "react";
import { DEFAULT_GROUP_NAME } from "@/shared/lib/quizTopic";
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
import { declineGroupMatch } from "@/features/matching/api/matchingApi";
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
 * 그룹 초대의 기본값은 참여다(ditto-server #397). 금 00:00 응답 마감까지 거절하지 않으면 서버가
 * 참여로 바꾸므로 응답 버튼은 "거절하기"만 둔다. 이 안내가 없으면 버튼이 하나뿐인 이유를 알 수 없다
 * (BE 위키 Frontend-Group-Matching-Guide §응답하지 않으면 참여).
 */
const AUTO_JOIN_NOTICE = "거절하지 않으면 금요일 00:00에 자동으로 참여돼요.";

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
    API_ERROR_CODE.GROUP_ALREADY_ACCEPTED, // 5005 — 다른 기기(예전 앱)에서 수락
    API_ERROR_CODE.GROUP_ALREADY_DECLINED, // 5006 (다른 그룹 수락에 따른 자동 거절 포함)
    API_ERROR_CODE.MATCH_NOT_CURRENT_WEEK, // 5008 — 지난 주 후보(탭을 열어 둔 채 주가 바뀐 경우)
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
  /**
   * 응답 대상 후보 그룹. 거절은 퀴즈셋이 아니라 `groupMatchId`로 보낸다.
   * 수락 API(`POST /matches/group/{id}/accept`)는 예전 앱을 위해 서버에 남아 있을 뿐 이 화면은 부르지 않는다.
   */
  group: GroupCandidateGroupDto;
  onDeclined: () => void;
  /** 서버와 어긋남(0003/0004/5005/5006/5008) — 후보 목록 재조회를 요청한다. */
  onStale: () => void;
  groupName?: string;
}

// ---- Component ----

export function GroupMatchingResultModal({
  isOpen,
  onClose,
  group,
  onDeclined,
  onStale,
  groupName = DEFAULT_GROUP_NAME,
}: GroupMatchingResultModalProps) {
  const { showToast } = useToast();
  const [profileSelect, setProfileSelect] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ReturnType<typeof toProfileDetail> | null>(null);
  const [rejectAlertOpen, setRejectAlertOpen] = useState(false);

  const candidates = group.members;

  /**
   * 화면에 뜨는 점수는 두 가지다. 그룹 카드는 **나와 각 구성원의 일치 수 평균**
   * (`averageMatchedQuestions`), 프로필 목록은 구성원 개인의 `matchedQuestions` 다.
   * 평균은 서버가 조회 시점에 계산해 내려 주므로 여기서 다시 구하지 않는다.
   */
  const avgMatched = group.averageMatchedQuestions;
  const totalQ = group.totalQuestions;
  const topBadge = getMatchBadgeInfo(avgMatched, totalQ);

  /**
   * 수락은 했지만 아직 성사 전(수락자 3명 미만). 이 화면에는 수락 버튼이 없으므로 예전 앱에서
   * 수락한 경우다. 응답을 끝냈으니 하단 CTA 만 내린다.
   * 그룹 카드(멤버 목록)는 계속 열린다 — 예전에는 카드까지 잠가, 수락한 뒤로는 같이 매칭된
   * 사람들을 다시 볼 길이 없었다(2026-11-19 QA "수락 후 멤버 리스트를 볼 수 없음").
   */
  const awaitingFormation = group.myStatus === "ACCEPTED";
  const hasResponded = group.myStatus !== "PENDING";

  const shown = candidates.slice(0, 3);
  const extra = candidates.length - 3;

  /** 서버가 이미 다른 상태다 — 에러 대신 최신 목록으로 화면을 맞춘다. */
  const handleStale = () => {
    showToast("이미 응답한 그룹이에요. 최신 결과를 다시 불러올게요.", "default", { duration: 3000 });
    onClose();
    onStale();
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
              <GroupCard onClick={() => setProfileSelect(true)}>
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

                <ChevronIcon
                  src="/icons/navigation/chevron-right.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              </GroupCard>
            </CardWrapper>
          )}
        </ContentBody>

        {/*
          응답 전(PENDING)에는 "거절하기"만 둔다 — 거절하지 않으면 마감에 참여로 처리된다(#397).
          응답을 마쳤으면(참여·거절) 더 할 행동이 없으니 CTA 를 내린다.
        */}
        {candidates.length > 0 && !hasResponded && (
          <BottomActions>
            <AutoJoinNotice $color="var(--color-semantic-label-alternative)">
              {AUTO_JOIN_NOTICE}
            </AutoJoinNotice>
            <ActionButton variant="secondary" onClick={() => setRejectAlertOpen(true)}>
              거절하기
            </ActionButton>
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
const GroupCard = styled.div`
  background-color: var(--color-semantic-fill-normal);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
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

const BottomActions = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  /* viewport 고정 하단 바. BottomActionArea와 동일한 인셋 규칙을 따른다. */
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  background-color: var(--color-semantic-background-normal-normal);
  border-top: 1px solid var(--color-semantic-line-normal-normal);
  z-index: 10;
`;

/* 버튼 위 안내 한 줄. ActionSheet 의 caption 과 같은 자리·톤이다. */
const AutoJoinNotice = styled(Label2)`
  text-align: center;
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
