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
import Card, { AlertStatus } from "@/components/display/Card";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import {
  ProfileImg,
  ProfileWrapper,
} from "@/components/onboarding/OnboardingContainer";
import { useTargetDayCountdown } from "@/lib/hooks/useKstCountdown";
import { useState } from "react";
import styled from "styled-components";
import BottomSheet from "../display/BottomSheet";
import MatchingResultModal from "./MatchingResultModal";

//- Styled Components
//================================================================================================
//* General
export const CardContainer = styled.div`
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

const ProfileContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: var(--space-4, 16px);
  align-self: stretch;
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

export type MatchingCardProps = {
  cardType: MatchingCardType;
};

type MatchingButtonProps = {
  cardType: MatchingCardType;
  buttonState: ButtonStateType;
  isChatTime: boolean;
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

//- Dummy Data
//================================================================================================
const dummyProfiles: Profile[] = [
  {
    name: "댕이누나",
    age: 28,
    gender: "여성",
    location: "서울",
    bio: "느긋한 집순이",
    avatarUrl: "/onboarding/profileimg/avatar/f1.svg",
    matchCount: 8,
  },
  {
    name: "safdaflnk",
    age: 23,
    gender: "남성",
    location: "서울",
    bio: "디코 좋아하는 겜돌이",
    avatarUrl: "/onboarding/profileimg/avatar/f2.svg",
    matchCount: 9,
  },
  {
    name: "러너쓰하이",
    age: 32,
    gender: "남성",
    location: "서울",
    bio: "3대 1000의 남자",
    avatarUrl: "/onboarding/profileimg/avatar/f5.svg",
    matchCount: 7,
  },
  {
    name: "개굴개굴렌",
    age: 28,
    gender: "여성",
    location: "서울",
    bio: "테토남 이런거 싫어함",
    avatarUrl: "/onboarding/profileimg/avatar/m3.svg",
    isMe: true,
    matchCount: 5,
  },
];

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

//- Sub Components
//================================================================================================

const BeforeMatchCard = ({ timeLeft }: { timeLeft: string }) => (
  <CardContainer>
    <FCardContainer>
      <FCardDivContainer>
        <CardDivContainer>
          <img src="/home/icons/time.svg" />
          <Label2 $color="var(--color-semantic-label-alternative)">
            남은 시간
          </Label2>
          <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
        </CardDivContainer>
      </FCardDivContainer>
      <img src="/home/quizpeople.svg" />
    </FCardContainer>
  </CardContainer>
);

const FailMatchCard = ({ imgSrc }: { imgSrc: string }) => (
  <CardContainer>
    <FailMatch>
      <Headline1 $weight="bold" $align="center">
        진행 중인 대화가 없어요
      </Headline1>
      <RandomImg src={imgSrc} />
      <div style={{ textAlign: "center" }}>
        <Body2Reading $color="var(--color-semantic-label-alternative)">
          지금은 대화 기간이에요!
        </Body2Reading>
        <Body2Reading $color="var(--color-semantic-label-alternative)">
          다음주에 다시 인연을 만들어 보세요.
        </Body2Reading>
      </div>
    </FailMatch>
  </CardContainer>
);

const OneOnOneMatchCard = ({ timeLeft }: { timeLeft: string }) => (
  <CardContainer>
    <MatchingContainer>
      <MatchingTopContainer>
        <ProfileWrapper>
          <ProfileImg imageUrl={"/onboarding/profileimg/avatar/f1.svg"} />
        </ProfileWrapper>
        <MatchingToplabel>
          <Heading2Bold>사부작사부작</Heading2Bold>
          <Label2 $color="var(--color-semantic-label-alternative)">
            28세 · 여성 · 서울
          </Label2>
          <Label2 $color="var(--color-semantic-label-alternative)">
            느긋한 집순이
          </Label2>
        </MatchingToplabel>
      </MatchingTopContainer>
      <MatchingBottomContainer>
        <div style={{ display: "flex", gap: "8px" }}>
          <img src="/home/icons/redclock.svg" />
          <Label2 style={{ paddingTop: "2px" }}>남은 시간</Label2>
        </div>
        <Body1Bold style={{ paddingTop: "2px" }}>{timeLeft}</Body1Bold>
      </MatchingBottomContainer>
    </MatchingContainer>
  </CardContainer>
);

const MatchingView = ({
  cardType,
  openProfileSelector,
  day,
}: {
  cardType: MatchingCardType;
  openProfileSelector: () => void;
  day: number;
}) => {
  const target = day === 4 ? 5 : 4;
  const timeLeft = useTargetDayCountdown(target);

  switch (cardType) {
    case "one":
      return <OneOnOneMatchCard timeLeft={timeLeft} />;
    case "many":
      return (
        <CardContainer>
          <GroupContainer>
            <TopContainer>
              <TopImgContainer onClick={openProfileSelector}>
                <ProfileImg
                  style={{ width: "40px", height: "40px" }}
                  imageUrl={"/onboarding/profileimg/avatar/f1.svg"}
                />
                <ProfileImg
                  style={{ width: "40px", height: "40px" }}
                  imageUrl={"/onboarding/profileimg/avatar/m3.svg"}
                />
                <ProfileImg
                  style={{ width: "40px", height: "40px" }}
                  imageUrl={"/onboarding/profileimg/avatar/m2.svg"}
                />
                <Plusmember>
                  <Label1Normal $color="white" $weight="bold">
                    +1
                  </Label1Normal>
                </Plusmember>
              </TopImgContainer>
              <TopRightContainer>
                <Headline2>같은 취미, 취향 그룹</Headline2>
                <Label2>댕이누나님 외 3명</Label2>
              </TopRightContainer>
            </TopContainer>
            <MatchingBottomContainer>
              <div style={{ display: "flex", gap: "8px" }}>
                <img src="/home/icons/redclock.svg" />
                <Label2 style={{ paddingTop: "2px" }}>남은 시간</Label2>
              </div>
              <Body1Bold style={{ paddingTop: "2px" }}>{timeLeft}</Body1Bold>
            </MatchingBottomContainer>
          </GroupContainer>
        </CardContainer>
      );
    default:
      return null;
  }
};

const ChattingView = ({
  cardType,
  openProfileSelector,
}: {
  cardType: MatchingCardType;
  openProfileSelector: () => void;
}) => {
  const timeMondayLeft = useTargetDayCountdown(1);

  if (cardType === "one") {
    return (
      <CardContainer>
        <ChatMainContainer>
          <ProfileWrapper>
            <ProfileImg imageUrl={"/onboarding/profileimg/avatar/f1.svg"} />
            <NotificationBadge>
              <Caption2
                style={{ paddingTop: "1px" }}
                $weight="bold"
                $color="white"
              >
                4
              </Caption2>
            </NotificationBadge>
          </ProfileWrapper>
          <ChatRightContainer>
            <MatchingToplabel>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <Heading2Bold>사부작사부작</Heading2Bold>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    28세 · 여성 · 서울
                  </Label2>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    느긋한 집순이
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
                    src="/home/icons/yellowclock.svg"
                    alt="clock"
                    style={{ width: "14px", height: "14px" }}
                  />
                </TimerBox>
              </div>
            </MatchingToplabel>
            <ChatContainer>
              <Label2 $color="var(--color-semantic-label-alternative)">
                ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ 웃겨요 어이없어!
              </Label2>
            </ChatContainer>
          </ChatRightContainer>
        </ChatMainContainer>
      </CardContainer>
    );
  }

  if (cardType === "many") {
    return (
      <CardContainer>
        <ChatMainContainer>
          <ProfileWrapper>
            <TopImgContainer onClick={openProfileSelector}>
              <ProfileImg
                style={{ width: "40px", height: "40px" }}
                imageUrl={"/onboarding/profileimg/avatar/f1.svg"}
              />
              <ProfileImg
                style={{ width: "40px", height: "40px" }}
                imageUrl={"/onboarding/profileimg/avatar/m3.svg"}
              />
              <ProfileImg
                style={{ width: "40px", height: "40px" }}
                imageUrl={"/onboarding/profileimg/avatar/m2.svg"}
              />
              <Plusmember>
                <Label1Normal $color="white" $weight="bold">
                  +1
                </Label1Normal>
              </Plusmember>
            </TopImgContainer>
            <NotificationBadge>
              <Caption2
                style={{ paddingTop: "1px" }}
                $weight="bold"
                $color="white"
              >
                4
              </Caption2>
            </NotificationBadge>
          </ProfileWrapper>
          <ChatRightContainer>
            <MatchingToplabel>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <Heading2Bold>같은 취미, 취향 그룹</Heading2Bold>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    댕이누나님 외 3명
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
                    src="/home/icons/yellowclock.svg"
                    alt="clock"
                    style={{
                      width: "14px",
                      height: "14px",
                      paddingRight: "2px",
                    }}
                  />
                </TimerBox>
              </div>
            </MatchingToplabel>
            <ChatContainer>
              <Label2 $color="var(--color-semantic-label-alternative)">
                모임 장소와 일정 : 투표가 등록되었습니다.
              </Label2>
            </ChatContainer>
          </ChatRightContainer>
        </ChatMainContainer>
      </CardContainer>
    );
  }

  return null;
};

const MatchingButton = ({
  cardType,
  buttonState,
  isChatTime,
  onClick,
}: MatchingButtonProps) => {
  const getButtonProps = () => {
    if (cardType === "beforematch") {
      return {
        icon: "/home/icons/send.svg",
        text: "대화 신청하기",
      };
    }
    if (isChatTime) {
      return {
        icon: "/home/icons/message.svg",
        text: "대화 계속하기",
      };
    }
    // Match Time
    return {
      icon: "/home/icons/locker.svg",
      text: "대화 시작하기",
    };
  };

  const buttonProps = getButtonProps();

  if (cardType === "many" && !isChatTime) {
    return (
      <ActionContainer>
        <ActionSheet>
          <ActionButton
            variant="disabled"
            onClick={() => { }}
            icon={<img src="/home/icons/locker.svg" />}
          >
            대화 시작하기
          </ActionButton>
        </ActionSheet>
      </ActionContainer>
    );
  }

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
            {profile.age}세 · {profile.gender} · {profile.location}
          </Label2>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {profile.bio}
          </Label2>
        </LabelContainer>
        {/* Chevron Icon */}
        <img src="/home/icons/chevron-right.svg" alt="detail" style={{ width: 24, height: 24, opacity: 0.3 }} />
      </ProfileCardWrapper>
    </ListItemContainer>
  );
};

//- Main Component
//================================================================================================
export default function MatchingDay({
  matchType,
  buttonState,
  day,
  isChatTime,
}: {
  matchType: MatchingCardType;
  buttonState: ButtonStateType;
  day: number;
  isChatTime: boolean;
}) {
  const [profileSelect, setProfileSelect] = useState(false);
  const [isMatchingResultOpen, setIsMatchingResultOpen] = useState(false);

  const openProfileSelector = () => setProfileSelect(true);
  const closeProfileSelector = () => setProfileSelect(false);

  const timeLeft = useTargetDayCountdown(day === 4 ? 5 : 4);
  const [imgSrc] = useState(getRandomImage);

  if (matchType === "beforematch") {
    return (
      <>
        <Card
          title="이번주 매칭"
          alert={!isChatTime ? "결과 확인" : undefined}
          alertType={!isChatTime ? "destructive" : undefined}
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
              onClick={() => setIsMatchingResultOpen(true)}
            />
          }
        />
        <MatchingResultModal
          isOpen={isMatchingResultOpen}
          onClose={() => setIsMatchingResultOpen(false)}
        />
      </>
    );
  }

  if (matchType === "failmatch") {
    return (
      <Card
        title="이번주 매칭"
        viewCard={<FailMatchCard imgSrc={imgSrc} />}
      />
    );
  }

  // Placeholder for match count (in real app, this would come from props or API)
  const matchCount = 11;



  const badgeInfo = getMatchBadgeInfo(matchCount);

  return (
    <>
      <Card
        title={isChatTime ? "이번주 만남" : "이번주 매칭"}
        alert={!isChatTime ? "매칭 완료" : undefined}
        alertType={!isChatTime ? "positive" : undefined}
        contentBadge={!isChatTime ? badgeInfo.badge : undefined}
        contentBadgeColor={!isChatTime ? badgeInfo.color : undefined}
        contentDescription={!isChatTime ? badgeInfo.description : undefined}
        subTitle={
          isChatTime ? (
            <>
              우연한 선택이지만 생각보다 잘 맞을지도 몰라요.
              <br />
              상대방을 천천히 알아가 보세요.
            </>
          ) : (
            <>
              만남이 이루어졌어요!
              <br />
              소개 노트를 보며 대화를 시작해 보세요.
            </>
          )
        }
        viewCard={
          isChatTime ? (
            <ChattingView
              cardType={matchType}
              openProfileSelector={openProfileSelector}
            />
          ) : (
            <MatchingView
              cardType={matchType}
              openProfileSelector={openProfileSelector}
              day={day}
            />
          )
        }
        buttonSection={
          <MatchingButton
            cardType={matchType}
            buttonState={buttonState}
            isChatTime={isChatTime}
          />
        }
      />

      {profileSelect && (
        <BottomSheet
          title="프로필 선택"
          detail={
            <SelectImgDiv>
              {dummyProfiles.map((profile) => (
                <BottomSheetProfile key={profile.name} profile={profile} />
              ))}
            </SelectImgDiv>
          }
          closer={closeProfileSelector}
        />
      )}
    </>
  );
}
