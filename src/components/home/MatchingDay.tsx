"use client";

import { Card } from "@/components/display/Card";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { toLocationLabel } from "@/shared/lib/profileLabels";
import type { ChatRoomItemDto } from "@/shared/lib/api/generated";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { useTargetDayCountdown } from "@/lib/hooks/useKstCountdown";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { BottomSheet } from "@/shared/ui";
import { GroupMatchingResultModal } from "@/components/home/GroupMatchingResultModal";
import { ProfileDetailModal, type ProfileDetailProfile } from "@/components/home/ProfileDetailModal";
import {
  AcceptedMatchCard,
  BeforeMatchCard,
  BottomSheetProfile,
  ChattingView,
  FailMatchCard,
  GroupJoinedCard,
  MatchingButton,
  MatchingCandidateCard,
} from "./_parts/MatchingDayCards";
import {
  ActionContainer,
  SelectableListItemContainer,
  SelectImgDiv,
} from "./_parts/MatchingDay.styles";
import {
  formatGender,
  getAvatarUrl,
  getMatchBadgeInfo,
  type ButtonStateType,
  type MatchingCardType,
} from "./_parts/MatchingDay.helpers";

export type { MatchingCardType } from "./_parts/MatchingDay.helpers";

export function MatchingDay({
  matchType,
  buttonState,
  day,
  isChatTime,
  candidates = [],
  hasAcceptedMatch = false,
  acceptedCandidate,
  groupJoined = false,
  onGroupJoined,
  groupJoinPending = false,
  onGroupJoinPending,
  chatRoom,
  quizSetId = "",
  onStartChat,
}: {
  matchType: MatchingCardType;
  buttonState: ButtonStateType;
  day: number;
  isChatTime: boolean;
  candidates?: MatchCandidateDto[];
  hasAcceptedMatch?: boolean;
  acceptedCandidate?: MatchCandidateDto;
  groupJoined?: boolean;
  onGroupJoined?: () => void;
  groupJoinPending?: boolean;
  onGroupJoinPending?: () => void;
  chatRoom?: ChatRoomItemDto;
  quizSetId?: string;
  onStartChat?: () => void;
}) {
  console.log('[src/components/home/MatchingDay.tsx] MatchingDay'); // __component_log__
  const router = useRouter();
  const [profileSelect, setProfileSelect] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupDeclined, setGroupDeclined] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetailProfile | null>(null);

  const { showToast } = useToast();
  const notifKey = quizSetId ? `ditto_match_accepted_notif_${quizSetId}` : null;

  // 매칭 수락 알림: quizSetId 확정 후 localStorage 확인
  useEffect(() => {
    if (!notifKey) return;
    if (!hasAcceptedMatch || !acceptedCandidate || isChatTime) return;
    const seen = localStorage.getItem(notifKey);
    if (!seen) {
      showToast("상대방이 대화를 수락했어요! 대화는 금요일에 시작돼요.", "success");
      localStorage.setItem(notifKey, "1");
    }
  }, [notifKey, hasAcceptedMatch, acceptedCandidate, isChatTime, showToast]);

  const openProfileSelector = () => setProfileSelect(true);
  const closeProfileSelector = () => setProfileSelect(false);

  const timeLeft = useTargetDayCountdown(day === 4 ? 5 : 4);

  // 그룹 참여 완료 상태: "매칭 완료" 카드
  if (groupJoined && !isChatTime && matchType === "many") {
    return (
      <>
        <Card
          title="이번주 매칭"
          alert="매칭 완료"
          alertType="positive"
          subTitle={
            <>
              만남이 이루어졌어요!<br />소개 노트를 보며 대화를 시작해 보세요.
            </>
          }
          viewCard={<GroupJoinedCard candidates={candidates} onCardClick={() => setProfileSelect(true)} />}
          buttonSection={
            <ActionContainer>
              <ActionSheet>
                <ActionButton
                  variant="disabled"
                  onClick={() => {}}
                  icon={<img src="/icons/action/lock.svg" alt="" />}
                >
                  대화 시작하기
                </ActionButton>
              </ActionSheet>
            </ActionContainer>
          }
        />

        {profileSelect && (
          <BottomSheet
            title="프로필 선택"
            detail={
              <SelectImgDiv>
                {candidates.map((c, i) => {
                  const detail = {
                    name: c.nickname,
                    age: c.age,
                    gender: formatGender(c.gender),
                    location: c.location ? toLocationLabel(c.location) : "",
                    bio: c.introduction ?? "",
                    avatarUrl: getAvatarUrl(c.gender, i),
                    matchCount: c.scoreBreakdown?.matchedQuestions,
                  };
                  return (
                    <SelectableListItemContainer
                      key={c.userId}
                      onClick={() => { setProfileSelect(false); setSelectedProfile(detail); }}
                    >
                      <BottomSheetProfile profile={detail} />
                    </SelectableListItemContainer>
                  );
                })}
              </SelectImgDiv>
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
      </>
    );
  }

  // 매칭 확정 상태: "매칭 완료" 카드 (MATCHING 기간에만 — CHATTING 기간엔 대화 화면으로)
  if (hasAcceptedMatch && acceptedCandidate && !isChatTime) {
    const acceptedBadge = getMatchBadgeInfo(acceptedCandidate.scoreBreakdown?.matchedQuestions ?? 0);
    return (
      <>
        <Card
          title="이번주 매칭"
          alert="매칭 완료"
          alertType="positive"
          contentBadge={acceptedBadge.badge}
          contentBadgeColor={acceptedBadge.color}
          contentDescription={acceptedBadge.description}
          subTitle={
            <>
              만남이 이루어졌어요!<br />소개 노트를 보며 대화를 시작해 보세요.
            </>
          }
          viewCard={<AcceptedMatchCard candidate={acceptedCandidate} onClick={() => {
            const profile = {
              name: acceptedCandidate.nickname,
              avatarUrl: acceptedCandidate.profileImageUrl || getAvatarUrl(acceptedCandidate.gender),
              ageRange: formatAgeRange(acceptedCandidate.age),
              gender: formatGender(acceptedCandidate.gender),
              location: acceptedCandidate.location ? toLocationLabel(acceptedCandidate.location) : "",
              bio: acceptedCandidate.introduction ?? "",
            };
            setSelectedProfile(profile);
          }} />}
          buttonSection={
            <ActionContainer>
              <ActionSheet>
                <ActionButton
                  variant="disabled"
                  onClick={() => {}}
                  icon={<img src="/icons/action/lock.svg" alt="" />}
                >
                  대화 시작하기
                </ActionButton>
              </ActionSheet>
            </ActionContainer>
          }
        />
        <ProfileDetailModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
          hideCta
        />
      </>
    );
  }

  if (matchType === "beforematch") {
    return (
      <Card
        title="이번주 매칭"
        alert={!isChatTime ? "결과 확인" : undefined}
        alertType={!isChatTime ? "destructive" : undefined}
        onAlertClick={!isChatTime ? () => router.push("/matching") : undefined}
        subTitle={
          <>
            나와 같이 생각하는 사람들을 만나볼까요?<br />소개 노트를 확인하고 대화를 신청해보세요.
          </>
        }
        viewCard={<BeforeMatchCard timeLeft={timeLeft} />}
        buttonSection={
          <MatchingButton
            cardType={matchType}
            buttonState={buttonState}
            isChatTime={isChatTime}
            onClick={() => router.push("/matching")}
          />
        }
      />
    );
  }

  if (matchType === "failmatch" || groupDeclined) {
    return <FailMatchCard isChatTime={isChatTime} />;
  }

  return (
    <>
      <Card
        title={isChatTime ? "이번주 만남" : "이번주 매칭"}
        alert={!isChatTime ? "결과 확인" : undefined}
        alertType={!isChatTime ? "destructive" : undefined}
        onAlertClick={!isChatTime ? () => router.push("/matching") : undefined}
        subTitle={
          isChatTime ? (
            <>
              우연한 선택이지만 생각보다 잘 맞을지도 몰라요.
              <br />
              상대방을 천천히 알아가 보세요.
            </>
          ) : (
            <>
              나와 같이 생각하는 사람들을 만나볼까요?
              <br />
              소개 노트를 확인하고 대화를 신청해보세요.
            </>
          )
        }
        viewCard={
          isChatTime ? (
            <ChattingView
              cardType={matchType}
              openProfileSelector={openProfileSelector}
              candidates={candidates}
              acceptedCandidate={acceptedCandidate}
              chatRoom={chatRoom}
            />
          ) : (
            <MatchingCandidateCard timeLeft={timeLeft} candidates={candidates} />
          )
        }
        buttonSection={
          <MatchingButton
            cardType={matchType}
            buttonState={buttonState}
            isChatTime={isChatTime}
            hasChat={!!chatRoom?.lastMessageContent}
            onClick={!isChatTime
              ? matchType === "many"
                ? () => setGroupModalOpen(true)
                : () => router.push("/matching")
              : onStartChat}
          />
        }
      />

      {profileSelect && (
        <BottomSheet
          title="프로필 선택"
          detail={
            <SelectImgDiv>
              {candidates.map((c, i) => (
                <BottomSheetProfile
                  key={c.userId}
                  profile={{
                    name: c.nickname,
                    age: c.age,
                    gender: formatGender(c.gender),
                    location: c.location ? toLocationLabel(c.location) : "",
                    bio: c.introduction ?? "",
                    avatarUrl: getAvatarUrl(c.gender, i),
                    matchCount: c.scoreBreakdown?.matchedQuestions,
                  }}
                />
              ))}
            </SelectImgDiv>
          }
          closer={closeProfileSelector}
        />
      )}

      <GroupMatchingResultModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onDecline={() => setGroupDeclined(true)}
        onJoinSuccess={onGroupJoined}
        onJoinPending={onGroupJoinPending}
        joinPending={groupJoinPending}
        candidates={candidates}
        quizSetId={quizSetId}
      />
    </>
  );
}
