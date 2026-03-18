"use client";

import {
  Body1Bold,
  Body2Reading,
  Caption1,
  Caption2,
  Heading2Bold,
  Headline1,
  Headline2,
  Label1Normal,
  Label2,
} from "@/components/common/Text";
import Card, { AlertStatus, CardContainer, DecoImg } from "@/components/display/Card";
import { MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { toLocationLabel } from "@/shared/lib/profileLabels";
import type { ChatRoomItemDto } from "@/lib/api/models/ChatRoomItemDto";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import {
  ProfileImg,
  ProfileWrapper,
} from "@/components/onboarding/OnboardingContainer";
import { useTargetDayCountdown } from "@/lib/hooks/useKstCountdown";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import styled from "styled-components";
import BottomSheet from "../display/BottomSheet";
import GroupMatchingResultModal from "./GroupMatchingResultModal";
import ProfileDetailModal from "./ProfileDetailModal";

//- Styled Components
//================================================================================================
//* General
export const ViewCardContainer = styled.div`
  display: flex;
  padding: 16px;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  flex: 1 1;
`;

export const CardDivContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
`;

export const ActionContainer = styled.div`
  width: 60%;
`;

//* MatchingCard
export const FCardContainer = styled.div`
  display: flex;
  padding: 16px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  flex: 1 0;
`;

export const FCardDivContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0;
`;

export const MatchingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
`;

export const MatchingTopContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-4, 16px);
  align-self: stretch;
`;

export const MatchingToplabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 4px;
  flex: 1 0 0;
`;

export const MatchingBottomContainer = styled.div`
  display: flex;
  width: 100%;
  height: 24px;
  justify-content: space-between;
  align-items: center;
`;

//* FailMatch
export const FailMatch = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  align-self: stretch;
`;

export const RandomImg = styled.img`
  width: 180px;
  height: 180px;
  aspect-ratio: 1/1;
`;

//* Chat
export const ChatMainContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-4, 16px);
  align-self: stretch;
`;

export const ChatRightContainer = styled.div`
  display: flex;
  width: 201px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`;

export const ChatContainer = styled.div`
  display: flex;
  padding: 8px;
  justify-content: left;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-radius: 0 12px 12px 12px;
  background: var(--color-component-fill-strong);
`;

export const NotificationBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: var(--color-semantic-status-negative); /* 톤다운된 레드 */
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

export const TimerBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1.5px solid #c47938; /* 오렌지 브라운 톤 */
  border-radius: 8px; /* 둥근 사각형 */
  width: 79px;
  height: 24px;
`;

// 피그마 1203:10081 — 아바타 콜라주 컨테이너 (150×150, 절대좌표 배치)
const AvatarCollage = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  flex-shrink: 0;
`;

const CollageSlot = styled.div<{ $size: number; $left: number; $top: number }>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  left: ${p => p.$left}px;
  top: ${p => p.$top}px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid var(--color-semantic-background-normal-normal);
  background-color: var(--color-semantic-background-normal-alternative, #DDD8D3);
`;


export const GroupJoinedInner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  cursor: pointer;
`;

export const GroupContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const TopContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-4, 16px);
  align-self: stretch;
`;

export const TopRightContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 4px;
  flex: 1 0 0;
`;

export const TopImgContainer = styled.div`
  display: grid;
  align-self: stretch;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

export const Plusmember = styled.div`
  display: flex;
  width: 40px;
  height: 40px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  aspect-ratio: 1/1;
  grid-row: 2 / span 1;
  grid-column: 2 / span 1;
  border-radius: var(--Radius-radi-8, 20px);
  opacity: var(--Opacity-35, 0.35);
  background: var(--Primary-Normal, #1a1815);
  backdrop-filter: blur(10px);
`;

//* BottomSheet
const MeLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-semantic-inverse-background);
  width: 25px;
  height: 24px;
  border-radius: 6px;
`;

const SelectImgDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-6, 24px);
  flex: 1 0 0;
  align-self: stretch;
  height: 510px;
  overflow-y: auto;

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
`;

const LabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 4px;
  flex: 1 0 0;
`;

// ✅ Local Styled Components for BottomSheet Profile
const BSBadgeRowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const BSContentBadge = styled.div<{ $status: AlertStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 6px;
  gap: 4px; /* Space between icon and text if any */
  border-radius: 6px;
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'positive':
        return 'rgba(85, 122, 85, 0.08)'; // var(--color-semantic-status-positive)
      case 'cautionary':
        return 'rgba(235, 90, 60, 0.08)'; // var(--color-semantic-status-cautionary)
      case 'navy':
        return 'rgba(from var(--color-semantic-accent-foreground-Navy) r g b / 0.08)';
      case 'destructive':
      default:
        return 'rgba(179, 53, 40, 0.08)'; // var(--color-semantic-status-negative)
    }
  }};
  height: 24px;
`;

const ProfileCardWrapper = styled.div`
  width: 100%;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--color-semantic-fill-normal, rgba(108, 101, 95, 0.08));
  box-sizing: border-box;
`;

const ListItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px; /* Gap between BadgeRow and ProfileCard */
  width: 100%;
`;

//- Types
//================================================================================================
export type MatchingCardType = "failmatch" | "one" | "many" | "beforematch";
export type ButtonStateType =
  | "primary"
  | "secondary"
  | "tertiary"
  | "disabled"
  | undefined;

type MatchingButtonProps = {
  cardType: MatchingCardType;
  buttonState: ButtonStateType;
  isChatTime: boolean;
  hasChat?: boolean;
  onClick?: () => void;
};

export interface Profile {
  name: string;
  age: number;
  gender: string;
  location: string;
  bio: string;
  avatarUrl: string;

  isMe?: boolean;
  matchCount?: number;
}


const getMatchBadgeInfo = (count: number): { badge: string; color: AlertStatus; description: string } => {
  if (count >= 11) {
    return {
      badge: "🌟 당신과 가장 비슷해요",
      color: "destructive", // Semantic/Status/Negative
      description: `12개중 ${count}개 일치`
    };
  } else if (count >= 8) {
    return {
      badge: "😊 대부분 비슷하게 생각해요",
      color: "destructive", // Semantic/Status/Negative
      description: `12개중 ${count}개 일치`
    };
  } else if (count >= 6) {
    return {
      badge: "🙂 비슷하지만 새로운 관점도 있어요",
      color: "cautionary", // Semantic/Status/Cautionary
      description: `12개중 ${count}개 일치`
    };
  } else {
    return {
      badge: "👀 다르게 생각하는 편이에요",
      color: "navy", // Semantic/Accent/Foreground/Navy
      description: `12개중 ${count}개 일치`
    };
  }
};

//- Helper Functions
//================================================================================================
export const getRandomImage = () => {
  const num = Math.floor(Math.random() * 10) + 1;
  return `/quiz/img/${num}.svg`;
};

function getAvatarUrl(gender: string, index: number = 0): string {
  if (gender === 'FEMALE') {
    return `/assets/avatar/f${(index % 3) + 1}.png`;
  }
  return `/assets/avatar/m${(index % 3) + 1}.png`;
}

function formatGender(gender: string): string {
  return gender === 'FEMALE' ? '여성' : '남성';
}

//- Sub Components
//================================================================================================

const BeforeMatchCard = ({ timeLeft }: { timeLeft: string }) => (
  <FCardContainer>
    <FCardDivContainer>
      <CardDivContainer>
        <img src="/icons/status/time.svg" />
        <Label2 $color="var(--color-semantic-label-alternative)">
          남은 시간
        </Label2>
        <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
      </CardDivContainer>
    </FCardDivContainer>
    <img src="/assets/illustration/quizpeople.svg" loading="lazy" />
  </FCardContainer>
);

const FailMatchCard = ({ isChatTime }: { isChatTime: boolean }) => (
  <CardContainer>
    <DecoImg src='/display/deco.svg' alt="decoration" />
    <FailMatch>
      <Headline1 $weight="bold" $align="center">
        {isChatTime ? "진행 중인 대화가 없어요." : "진행 중인 매칭이 없어요."}
      </Headline1>
      <RandomImg src="/assets/illustration/empty-state.png" loading="lazy" />
      <div style={{ textAlign: "center" }}>
        <Body2Reading $color="var(--color-semantic-label-alternative)">
          {isChatTime ? "지금은 대화 기간이에요!" : "지금은 매칭 기간이에요!"}
        </Body2Reading>
        <Body2Reading $color="var(--color-semantic-label-alternative)">
          다음주에 다시 인연을 만들어 보세요.
        </Body2Reading>
      </div>
    </FailMatch>
  </CardContainer>
);

// 피그마 1203:10081 — 매칭 기간 카드: 익명 아바타 콜라주 + 남은 시간 (후보자 정보 노출 없음)
const MatchingCandidateCard = ({ timeLeft, candidates }: { timeLeft: string; candidates: MatchCandidateDto[] }) => {
  // 4개 슬롯: 실제 후보자 성별 순환, 부족하면 기본 성별
  const slotGender = (i: number) =>
    candidates.length > 0 ? candidates[i % candidates.length].gender : (i % 2 === 0 ? "MALE" : "FEMALE");

  return (
    <ViewCardContainer>
      <FCardContainer>
        <FCardDivContainer>
          <CardDivContainer>
            <img src="/icons/status/time.svg" alt="" />
            <Label2 $color="var(--color-semantic-label-alternative)">남은 시간</Label2>
            <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
          </CardDivContainer>
        </FCardDivContainer>
        <AvatarCollage>
          {/* 피그마 좌표: bottom-right 72px */}
          <CollageSlot $size={72} $left={73} $top={69}>
            <ProfileImg imageUrl={getAvatarUrl(slotGender(0), 0)} style={{ width: "100%", height: "100%" }} />
          </CollageSlot>
          {/* top-right 48px */}
          <CollageSlot $size={48} $left={84} $top={10}>
            <ProfileImg imageUrl={getAvatarUrl(slotGender(1), 1)} style={{ width: "100%", height: "100%" }} />
          </CollageSlot>
          {/* top-left 60px */}
          <CollageSlot $size={60} $left={6} $top={7}>
            <ProfileImg imageUrl={getAvatarUrl(slotGender(2), 2)} style={{ width: "100%", height: "100%" }} />
          </CollageSlot>
          {/* bottom-left 46px */}
          <CollageSlot $size={46} $left={11} $top={85}>
            <ProfileImg imageUrl={getAvatarUrl(slotGender(3), 3)} style={{ width: "100%", height: "100%" }} />
          </CollageSlot>
        </AvatarCollage>
      </FCardContainer>
    </ViewCardContainer>
  );
};

const ChattingView = ({
  cardType,
  openProfileSelector,
  candidates,
  acceptedCandidate,
  chatRoom,
}: {
  cardType: MatchingCardType;
  openProfileSelector: () => void;
  candidates: MatchCandidateDto[];
  acceptedCandidate?: MatchCandidateDto;
  chatRoom?: ChatRoomItemDto;
}) => {
  const timeMondayLeft = useTargetDayCountdown(1);
  const hasChat = !!chatRoom?.lastMessage;

  if (cardType === "one") {
    const c = acceptedCandidate ?? candidates[0];
    return (
      <ViewCardContainer>
        <ChatMainContainer>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ProfileWrapper>
              <ProfileImg imageUrl={getAvatarUrl(c?.gender ?? 'MALE')} />
            </ProfileWrapper>
            {hasChat && (chatRoom?.unreadCount ?? 0) > 0 && (
              <NotificationBadge>
                <Caption2 $color="white" $weight="bold">
                  {chatRoom!.unreadCount}
                </Caption2>
              </NotificationBadge>
            )}
          </div>
          <ChatRightContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Heading2Bold>{c?.nickname ?? ""}</Heading2Bold>
                <TimerBox>
                  <Body1Bold
                    style={{ fontSize: "12px", paddingLeft: "9px" }}
                    $color="var(--color-semantic-status-cautionary)"
                  >
                    {timeMondayLeft}
                  </Body1Bold>
                  <img
                    src="/icons/status/clock-yellow.svg"
                    alt="clock"
                    style={{ width: "14px", height: "14px" }}
                  />
                </TimerBox>
              </div>
              <Label2 $color="var(--color-semantic-label-alternative)">
                {c ? `${formatAgeRange(c.age)} · ${formatGender(c.gender)}${c.location ? ` · ${toLocationLabel(c.location)}` : ""}` : ""}
              </Label2>
              {c?.introduction && (
                <Label2 $color="var(--color-semantic-label-alternative)">
                  {c.introduction}
                </Label2>
              )}
            </div>
            <ChatContainer>
              <Label2 $color="var(--color-semantic-label-alternative)">
                {hasChat ? chatRoom!.lastMessage!.content : "대화를 시작해보세요"}
              </Label2>
            </ChatContainer>
          </ChatRightContainer>
        </ChatMainContainer>
      </ViewCardContainer>
    );
  }

  if (cardType === "many") {
    const shown = candidates.slice(0, 3);
    const extra = candidates.length - 3;
    const firstName = candidates[0]?.nickname ?? "";
    const othersCount = candidates.length - 1;
    return (
      <ViewCardContainer>
        <ChatMainContainer>
          <ProfileWrapper>
            <TopImgContainer onClick={openProfileSelector}>
              {shown.map((c, i) => (
                <ProfileImg
                  key={c.userId}
                  style={{ width: "40px", height: "40px" }}
                  imageUrl={getAvatarUrl(c.gender, i)}
                />
              ))}
              {extra > 0 && (
                <Plusmember>
                  <Label1Normal $color="white" $weight="bold">
                    +{extra}
                  </Label1Normal>
                </Plusmember>
              )}
            </TopImgContainer>
          </ProfileWrapper>
          <ChatRightContainer>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
              <div>
                <Heading2Bold>같은 취미, 취향 그룹</Heading2Bold>
                <Label2 $color="var(--color-semantic-label-alternative)">
                  {firstName}님 외 {othersCount}명
                </Label2>
              </div>
              <TimerBox>
                <Body1Bold
                  style={{ fontSize: "12px", paddingLeft: "9px" }}
                  $color="var(--color-semantic-status-cautionary)"
                >
                  {timeMondayLeft}
                </Body1Bold>
                <img
                  src="/icons/status/clock-yellow.svg"
                  alt="clock"
                  style={{ width: "14px", height: "14px", paddingRight: "2px" }}
                />
              </TimerBox>
            </div>
            <ChatContainer>
              <Label2 $color="var(--color-semantic-label-alternative)">
                {hasChat ? chatRoom!.lastMessage!.content : "대화를 시작해보세요"}
              </Label2>
            </ChatContainer>
          </ChatRightContainer>
        </ChatMainContainer>
      </ViewCardContainer>
    );
  }

  return null;
};

const MatchingButton = ({
  cardType,
  buttonState,
  isChatTime,
  hasChat = false,
  onClick,
}: MatchingButtonProps) => {
  const getButtonProps = () => {
    if (isChatTime) {
      return hasChat
        ? { icon: "/icons/action/message.svg", text: "대화 계속하기" }
        : { icon: "/icons/action/message.svg", text: "대화 시작하기" };
    }
    return {
      icon: "/icons/action/send.svg",
      text: "대화 신청하기",
    };
  };

  const buttonProps = getButtonProps();

  return (
    <ActionContainer>
      <ActionSheet>
        <ActionButton
          variant={buttonState}
          onClick={onClick || (() => { })}
          icon={<img src={buttonProps.icon} />}
        >
          {buttonProps.text}
        </ActionButton>
      </ActionSheet>
    </ActionContainer>
  );
};

const BottomSheetProfile = ({ profile }: { profile: Profile }) => {
  const badgeInfo = profile.matchCount ? getMatchBadgeInfo(profile.matchCount) : null;

  return (
    <ListItemContainer>
      {badgeInfo && (
        <BSBadgeRowContainer>
          <BSContentBadge $status={badgeInfo.color}>
            <Caption1 $color={
              badgeInfo.color === 'positive' ? 'var(--color-semantic-status-positive)' :
                badgeInfo.color === 'cautionary' ? 'var(--color-semantic-status-cautionary)' :
                  badgeInfo.color === 'navy' ? 'var(--color-semantic-accent-foreground-Navy)' :
                    'var(--color-semantic-status-negative)'
            }>{badgeInfo.badge}</Caption1>
          </BSContentBadge>
          <Caption1 $color="var(--color-semantic-label-alternative)">{badgeInfo.description}</Caption1>
        </BSBadgeRowContainer>
      )}
      <ProfileCardWrapper>
        <ProfileWrapper>
          <ProfileImg imageUrl={profile.avatarUrl} />
        </ProfileWrapper>
        <LabelContainer>
          <div style={{ display: "flex", gap: "12px" }}>
            <Headline2 style={{ paddingTop: "2px" }}>{profile.name}</Headline2>
            {profile.isMe && (
              <MeLabel>
                <Caption1 $color="white">나</Caption1>
              </MeLabel>
            )}
          </div>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {formatAgeRange(profile.age)} · {profile.gender} · {profile.location}
          </Label2>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {profile.bio}
          </Label2>
        </LabelContainer>
        {/* Chevron Icon */}
        <img src="/icons/navigation/chevron-right.svg" alt="detail" style={{ width: 24, height: 24, opacity: 0.3 }} />
      </ProfileCardWrapper>
    </ListItemContainer>
  );
};

const GroupJoinedCard = ({ candidates, onCardClick }: { candidates: MatchCandidateDto[]; onCardClick: () => void }) => {
  const timeLeft = useTargetDayCountdown(5); // 금요일(대화 시작일)까지
  const shown = candidates.slice(0, 3);
  const extra = candidates.length - 3;
  const firstName = candidates[0]?.nickname ?? "";
  const othersCount = candidates.length - 1;

  return (
    <ViewCardContainer style={{ flexDirection: "column", gap: "8px" }}>
      <GroupJoinedInner onClick={onCardClick}>
        <ProfileWrapper>
          <TopImgContainer>
            {shown.map((c, i) => (
              <ProfileImg
                key={c.userId}
                style={{ width: "40px", height: "40px" }}
                imageUrl={getAvatarUrl(c.gender, i)}
              />
            ))}
            {extra > 0 && (
              <Plusmember>
                <Label1Normal $color="white" $weight="bold">+{extra}</Label1Normal>
              </Plusmember>
            )}
          </TopImgContainer>
        </ProfileWrapper>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <Headline2>같은 취미, 취향 그룹</Headline2>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {firstName}님 외 {othersCount}명
          </Label2>
        </div>
        <img src="/icons/navigation/chevron-right.svg" alt="" width={24} height={24} style={{ opacity: 0.3, flexShrink: 0 }} />
      </GroupJoinedInner>
      <MatchingBottomContainer>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <img src="/icons/status/time.svg" alt="" style={{ width: "16px", height: "16px" }} />
          <Caption2 $color="var(--color-semantic-label-alternative)">남은 시간</Caption2>
        </div>
        <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
      </MatchingBottomContainer>
    </ViewCardContainer>
  );
};

const AcceptedMatchCard = ({ candidate, onClick }: { candidate: MatchCandidateDto; onClick?: () => void }) => {
  const timeLeft = useTargetDayCountdown(5); // 금요일(대화 시작일)까지
  const avatarUrl = candidate.profileImageUrl || getAvatarUrl(candidate.gender);
  const meta = `${formatAgeRange(candidate.age)} · ${formatGender(candidate.gender)}${candidate.location ? ` · ${toLocationLabel(candidate.location)}` : ""}`;

  return (
    <ViewCardContainer style={{ flexDirection: "column", gap: "8px", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", width: "100%" }}>
        <ProfileWrapper>
          <ProfileImg imageUrl={avatarUrl} />
        </ProfileWrapper>
        <LabelContainer>
          <Headline2>{candidate.nickname}</Headline2>
          <Label2 $color="var(--color-semantic-label-alternative)">{meta}</Label2>
          {candidate.introduction && (
            <Label2 $color="var(--color-semantic-label-alternative)">{candidate.introduction}</Label2>
          )}
        </LabelContainer>
      </div>
      <MatchingBottomContainer>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <img src="/icons/status/time.svg" alt="" style={{ width: "16px", height: "16px" }} />
          <Caption2 $color="var(--color-semantic-label-alternative)">남은 시간</Caption2>
        </div>
        <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
      </MatchingBottomContainer>
    </ViewCardContainer>
  );
};

//- Main Component
//================================================================================================
export default function MatchingDay({
  matchType,
  buttonState,
  day,
  isChatTime,
  candidates = [],
  hasAcceptedMatch = false,
  acceptedCandidate,
  groupJoined = false,
  onGroupJoined,
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
  chatRoom?: ChatRoomItemDto;
  quizSetId?: string;
  onStartChat?: () => void;
}) {
  console.log('[src/components/home/MatchingDay.tsx] MatchingDay'); // __component_log__
  const router = useRouter();
  const [profileSelect, setProfileSelect] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupDeclined, setGroupDeclined] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

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
                  const badge = getMatchBadgeInfo(c.scoreBreakdown?.matchedQuestions ?? 0);
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
                    <ListItemContainer
                      key={c.userId}
                      onClick={() => { setProfileSelect(false); setSelectedProfile(detail); }}
                      style={{ cursor: "pointer" }}
                    >
                      <BottomSheetProfile profile={detail} />
                    </ListItemContainer>
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
            hasChat={!!chatRoom?.lastMessage}
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
        candidates={candidates}
        quizSetId={quizSetId}
      />
    </>
  );
}
