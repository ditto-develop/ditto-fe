"use client";

import { Card } from "@/components/display/Card";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { toLocationLabel } from "@/shared/lib/profileLabels";
import type { ChatRoom } from "@/features/chat";
import { getLastMessagePreview } from "@/features/chat";
import { ActionButton } from "@/components/input/Action";
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
  matchAcceptedNotifKey,
  type ButtonStateType,
  type MatchingCardType,
} from "./_parts/MatchingDay.helpers";

import { trackCardClick, useCardImpression } from "@/shared/lib/analytics";

export type { MatchingCardType } from "./_parts/MatchingDay.helpers";

export function MatchingDay({
  matchType,
  buttonState,
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
  isChatTime: boolean;
  candidates?: MatchCandidateDto[];
  hasAcceptedMatch?: boolean;
  acceptedCandidate?: MatchCandidateDto;
  groupJoined?: boolean;
  onGroupJoined?: () => void;
  groupJoinPending?: boolean;
  onGroupJoinPending?: () => void;
  chatRoom?: ChatRoom;
  quizSetId?: string;
  onStartChat?: () => void;
}) {
  const router = useRouter();
  const [profileSelect, setProfileSelect] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupDeclined, setGroupDeclined] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetailProfile | null>(null);

  const { showToast } = useToast();
  const notifKey = quizSetId ? matchAcceptedNotifKey(quizSetId) : null;

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

  /**
   * 이 카드가 지금 어떤 모습인지. 아래 분기와 **같은 순서**로 판정해야 한다 —
   * 어긋나면 노출은 A 로, 클릭은 B 로 잡혀 클릭률이 통째로 틀어진다.
   */
  const cardState = (() => {
    if (groupJoined && !isChatTime && matchType === "many") return "group_joined";
    if (hasAcceptedMatch && acceptedCandidate && !isChatTime) return "accepted";
    if (matchType === "beforematch") return "beforematch";
    if (matchType === "failmatch" || groupDeclined) return "failmatch";
    return isChatTime ? `chat_${matchType}` : matchType;
  })();

  // 클릭률의 분모. 조기 반환보다 위에 있어야 한다 — 훅은 분기 뒤에 둘 수 없다.
  useCardImpression("matching", cardState);
  const trackClick = (action: string) => trackCardClick("matching", cardState, action);

  const openProfileSelector = () => setProfileSelect(true);
  const closeProfileSelector = () => setProfileSelect(false);

  /**
   * 남은 시간의 목표일은 기기 요일이 아니라 **서버 기간**을 따른다.
   * 매칭 기간이면 대화가 열리는 금요일까지, 대화 기간이면 다음 퀴즈가 열리는 월요일까지.
   * 요일로 정하면 어드민 '시간 임시 조정'으로 기간을 바꿔도 카운트다운은 실제 요일 기준으로
   * 남아 화면의 기간과 어긋났다(QA 2026-09-09).
   */
  const timeLeft = useTargetDayCountdown(isChatTime ? 1 : 5);

  /**
   * 매칭은 됐지만 아직 대화 기간이 아닐 때의 잠긴 버튼.
   * 눌러도 아무 일이 없으면 고장난 것처럼 보인다 — 언제 열리는지 알려 준다.
   */
  const notifyChatNotOpenYet = () => {
    // 잠긴 버튼도 클릭이다. 여기가 크면 "대화를 열어 달라"는 수요가 그만큼 있다는 뜻이다.
    trackClick("locked_start_chat");
    showToast("대화는 금요일에 시작돼요!", "default");
  };

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
          viewCard={<GroupJoinedCard candidates={candidates} onCardClick={() => {
            trackClick("open_group_profiles");
            setProfileSelect(true);
          }} />}
          buttonSection={
            <ActionContainer>
              <ActionButton
                variant="disabled"
                onClick={notifyChatNotOpenYet}
                icon={<img src="/icons/action/lock.svg" alt="" />}
              >
                대화 시작하기
              </ActionButton>
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
                    // 매칭이 성사됐으니 소개노트 전체를 읽어 온다(id 가 있어야 상세 조회가 돈다).
                    id: c.userId,
                    name: c.nickname,
                    age: c.age,
                    gender: formatGender(c.gender),
                    location: c.location ? toLocationLabel(c.location) : "",
                    bio: c.introduction ?? "",
                    avatarUrl: c.profileImageUrl || getAvatarUrl(c.gender, i),
                    matchCount: c.scoreBreakdown?.matchedQuestions,
                    totalQuestions: c.scoreBreakdown?.totalQuestions,
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
          showAllNotes
        />
      </>
    );
  }

  // 매칭 확정 상태: "매칭 완료" 카드 (MATCHING 기간에만 — CHATTING 기간엔 대화 화면으로)
  if (hasAcceptedMatch && acceptedCandidate && !isChatTime) {
    const acceptedBadge = getMatchBadgeInfo(
      acceptedCandidate.scoreBreakdown?.matchedQuestions ?? 0,
      acceptedCandidate.scoreBreakdown?.totalQuestions ?? 12
    );
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
              // 매칭이 성사됐으니 소개노트 전체를 읽어 온다(id 가 있어야 상세 조회가 돈다).
              id: acceptedCandidate.userId,
              name: acceptedCandidate.nickname,
              avatarUrl: acceptedCandidate.profileImageUrl || getAvatarUrl(acceptedCandidate.gender),
              ageRange: formatAgeRange(acceptedCandidate.age),
              gender: formatGender(acceptedCandidate.gender),
              location: acceptedCandidate.location ? toLocationLabel(acceptedCandidate.location) : "",
              bio: acceptedCandidate.introduction ?? "",
            };
            trackClick("open_accepted_profile");
            setSelectedProfile(profile);
          }} />}
          buttonSection={
            <ActionContainer>
              <ActionButton
                variant="disabled"
                onClick={notifyChatNotOpenYet}
                icon={<img src="/icons/action/lock.svg" alt="" />}
              >
                대화 시작하기
              </ActionButton>
            </ActionContainer>
          }
        />
        <ProfileDetailModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
          hideCta
          showAllNotes
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
        onAlertClick={!isChatTime ? () => {
          trackClick("alert_view_result");
          router.push("/matching");
        } : undefined}
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
            onClick={() => {
              trackClick("view_result");
              router.push("/matching");
            }}
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
        onAlertClick={!isChatTime ? () => {
          trackClick("alert_view_result");
          router.push("/matching");
        } : undefined}
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
            hasChat={!!(chatRoom && getLastMessagePreview(chatRoom))}
            onClick={!isChatTime
              ? matchType === "many"
                ? () => {
                    trackClick("open_group_modal");
                    setGroupModalOpen(true);
                  }
                : () => {
                    trackClick("view_result");
                    router.push("/matching");
                  }
              : () => {
                  trackClick("start_chat");
                  onStartChat?.();
                }}
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
                    avatarUrl: c.profileImageUrl || getAvatarUrl(c.gender, i),
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
