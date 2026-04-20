import { AnimatePresence } from "framer-motion";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { CardContainer, DecoImg } from "@/components/display/Card";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";
import type { ChatRoomItemDto } from "@/shared/lib/api/generated";
import { Body1Bold, Body2Reading, Caption1, Caption2, Heading2Bold, Headline1, Headline2, Label1Normal, Label2 } from "@/shared/ui";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { toLocationLabel } from "@/shared/lib/profileLabels";
import { ProfileImg, ProfileWrapper } from "@/components/onboarding/OnboardingContainer";
import { useTargetDayCountdown } from "@/lib/hooks/useKstCountdown";
import {
  AcceptedProfileRow,
  AcceptedViewCardContainer,
  ActionContainer,
  AvatarCollage,
  BSBadgeRowContainer,
  BSContentBadge,
  CardDivContainer,
  CenteredTextBlock,
  ChatContainer,
  ChatGroupHeaderRow,
  ChatHeaderRow,
  ChatInfoColumn,
  ChatMainContainer,
  ChatPreviewLabel,
  ChatPreviewText,
  ChatPreviewViewport,
  ChatRightContainer,
  ChevronIcon,
  CollageSlot,
  ColumnViewCardContainer,
  FCardContainer,
  FCardDivContainer,
  FailMatch,
  FullSizeProfileImg,
  GroupJoinedInner,
  GroupTextColumn,
  LabelContainer,
  ListItemContainer,
  MatchingBottomContainer,
  MeLabel,
  NotificationBadge,
  Plusmember,
  ProfileCardWrapper,
  ProfileName,
  ProfileNameRow,
  RandomImg,
  RelativeProfileSlot,
  SelectableListItemContainer,
  SmallProfileImg,
  TimeIcon,
  TimeLabelRow,
  TimerBox,
  TimerIcon,
  TimerIconWithPadding,
  TimerText,
  TopImgContainer,
  ViewCardContainer,
} from "./MatchingDay.styles";
import {
  formatGender,
  getAvatarUrl,
  getMatchBadgeInfo,
  type MatchingButtonProps,
  type MatchingCardType,
  type Profile,
} from "./MatchingDay.helpers";

export const BeforeMatchCard = ({ timeLeft }: { timeLeft: string }) => (
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

export const FailMatchCard = ({ isChatTime }: { isChatTime: boolean }) => (
  <CardContainer>
    <DecoImg src='/display/deco.svg' alt="decoration" />
    <FailMatch>
      <Headline1 $weight="bold" $align="center">
        {isChatTime ? "진행 중인 대화가 없어요." : "진행 중인 매칭이 없어요."}
      </Headline1>
      <RandomImg src="/assets/illustration/empty-state.png" loading="lazy" />
      <CenteredTextBlock>
        <Body2Reading $color="var(--color-semantic-label-alternative)">
          {isChatTime ? "지금은 대화 기간이에요!" : "지금은 매칭 기간이에요!"}
        </Body2Reading>
        <Body2Reading $color="var(--color-semantic-label-alternative)">
          다음주에 다시 인연을 만들어 보세요.
        </Body2Reading>
      </CenteredTextBlock>
    </FailMatch>
  </CardContainer>
);

// 피그마 1203:10081 — 매칭 기간 카드: 익명 아바타 콜라주 + 남은 시간 (후보자 정보 노출 없음)
export const MatchingCandidateCard = ({ timeLeft, candidates }: { timeLeft: string; candidates: MatchCandidateDto[] }) => {
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
            <FullSizeProfileImg imageUrl={getAvatarUrl(slotGender(0), 0)} />
          </CollageSlot>
          {/* top-right 48px */}
          <CollageSlot $size={48} $left={84} $top={10}>
            <FullSizeProfileImg imageUrl={getAvatarUrl(slotGender(1), 1)} />
          </CollageSlot>
          {/* top-left 60px */}
          <CollageSlot $size={60} $left={6} $top={7}>
            <FullSizeProfileImg imageUrl={getAvatarUrl(slotGender(2), 2)} />
          </CollageSlot>
          {/* bottom-left 46px */}
          <CollageSlot $size={46} $left={11} $top={85}>
            <FullSizeProfileImg imageUrl={getAvatarUrl(slotGender(3), 3)} />
          </CollageSlot>
        </AvatarCollage>
      </FCardContainer>
    </ViewCardContainer>
  );
};

export const ChattingView = ({
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
  const hasChat = !!chatRoom?.lastMessageContent;
  const chatPreviewText = hasChat ? chatRoom!.lastMessageContent! : "대화를 시작해보세요";

  if (cardType === "one") {
    const c = acceptedCandidate ?? candidates[0];
    return (
      <ViewCardContainer>
        <ChatMainContainer>
          <RelativeProfileSlot>
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
          </RelativeProfileSlot>
          <ChatRightContainer>
            <ChatInfoColumn>
              <ChatHeaderRow>
                <Heading2Bold>{c?.nickname ?? ""}</Heading2Bold>
                <TimerBox>
                  <TimerText
                    $color="var(--color-semantic-status-cautionary)"
                  >
                    {timeMondayLeft}
                  </TimerText>
                  <TimerIcon
                    src="/icons/status/clock-yellow.svg"
                    alt="clock"
                  />
                </TimerBox>
              </ChatHeaderRow>
              <Label2 $color="var(--color-semantic-label-alternative)">
                {c ? `${formatAgeRange(c.age)} · ${formatGender(c.gender)}${c.location ? ` · ${toLocationLabel(c.location)}` : ""}` : ""}
              </Label2>
              {c?.introduction && (
                <Label2 $color="var(--color-semantic-label-alternative)">
                  {c.introduction}
                </Label2>
              )}
            </ChatInfoColumn>
            <ChatContainer>
              <AnimatedChatPreview text={chatPreviewText} />
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
                <SmallProfileImg
                  key={c.userId}
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
            <ChatGroupHeaderRow>
              <div>
                <Heading2Bold>같은 취미, 취향 그룹</Heading2Bold>
                <Label2 $color="var(--color-semantic-label-alternative)">
                  {firstName}님 외 {othersCount}명
                </Label2>
              </div>
                <TimerBox>
                <TimerText
                  $color="var(--color-semantic-status-cautionary)"
                >
                  {timeMondayLeft}
                </TimerText>
                <TimerIconWithPadding
                  src="/icons/status/clock-yellow.svg"
                  alt="clock"
                />
              </TimerBox>
            </ChatGroupHeaderRow>
            <ChatContainer>
              <AnimatedChatPreview text={chatPreviewText} />
            </ChatContainer>
          </ChatRightContainer>
        </ChatMainContainer>
      </ViewCardContainer>
    );
  }

  return null;
};

const AnimatedChatPreview = ({ text }: { text: string }) => (
  <ChatPreviewViewport>
    <AnimatePresence initial={false} mode="popLayout">
      <ChatPreviewText
        key={text}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -18, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <ChatPreviewLabel $color="var(--color-semantic-label-alternative)">
          {text}
        </ChatPreviewLabel>
      </ChatPreviewText>
    </AnimatePresence>
  </ChatPreviewViewport>
);

export const MatchingButton = ({
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

export const BottomSheetProfile = ({ profile }: { profile: Profile }) => {
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
          <ProfileNameRow>
            <ProfileName>{profile.name}</ProfileName>
            {profile.isMe && (
              <MeLabel>
                <Caption1 $color="white">나</Caption1>
              </MeLabel>
            )}
          </ProfileNameRow>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {formatAgeRange(profile.age)} · {profile.gender} · {profile.location}
          </Label2>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {profile.bio}
          </Label2>
        </LabelContainer>
        {/* Chevron Icon */}
        <ChevronIcon src="/icons/navigation/chevron-right.svg" alt="detail" />
      </ProfileCardWrapper>
    </ListItemContainer>
  );
};

export const GroupJoinedCard = ({ candidates, onCardClick }: { candidates: MatchCandidateDto[]; onCardClick: () => void }) => {
  const timeLeft = useTargetDayCountdown(5); // 금요일(대화 시작일)까지
  const shown = candidates.slice(0, 3);
  const extra = candidates.length - 3;
  const firstName = candidates[0]?.nickname ?? "";
  const othersCount = candidates.length - 1;

  return (
    <ColumnViewCardContainer>
      <GroupJoinedInner onClick={onCardClick}>
        <ProfileWrapper>
          <TopImgContainer>
            {shown.map((c, i) => (
              <SmallProfileImg
                key={c.userId}
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
        <GroupTextColumn>
          <Headline2>같은 취미, 취향 그룹</Headline2>
          <Label2 $color="var(--color-semantic-label-alternative)">
            {firstName}님 외 {othersCount}명
          </Label2>
        </GroupTextColumn>
        <ChevronIcon src="/icons/navigation/chevron-right.svg" alt="" />
      </GroupJoinedInner>
      <MatchingBottomContainer>
        <TimeLabelRow>
          <TimeIcon src="/icons/status/time.svg" alt="" />
          <Caption2 $color="var(--color-semantic-label-alternative)">남은 시간</Caption2>
        </TimeLabelRow>
        <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
      </MatchingBottomContainer>
    </ColumnViewCardContainer>
  );
};

export const AcceptedMatchCard = ({ candidate, onClick }: { candidate: MatchCandidateDto; onClick?: () => void }) => {
  const timeLeft = useTargetDayCountdown(5); // 금요일(대화 시작일)까지
  const avatarUrl = candidate.profileImageUrl || getAvatarUrl(candidate.gender);
  const meta = `${formatAgeRange(candidate.age)} · ${formatGender(candidate.gender)}${candidate.location ? ` · ${toLocationLabel(candidate.location)}` : ""}`;

  return (
    <AcceptedViewCardContainer $clickable={!!onClick} onClick={onClick}>
      <AcceptedProfileRow>
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
      </AcceptedProfileRow>
      <MatchingBottomContainer>
        <TimeLabelRow>
          <TimeIcon src="/icons/status/time.svg" alt="" />
          <Caption2 $color="var(--color-semantic-label-alternative)">남은 시간</Caption2>
        </TimeLabelRow>
        <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
      </MatchingBottomContainer>
    </AcceptedViewCardContainer>
  );
};

//- Main Component
