import styled from "styled-components";
import { motion } from "framer-motion";
import { Body1Bold, Caption1, Headline2, Label2 } from "@/shared/ui";
import type { AlertStatus } from "@/components/display/Card";
import { ProfileImg } from "@/components/onboarding/OnboardingContainer";

export const ViewCardContainer = styled.div`
  display: flex;
  padding: 16px;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  flex: 1 1;
`;

export const CenteredTextBlock = styled.div`
  text-align: center;
`;

export const ColumnViewCardContainer = styled(ViewCardContainer)`
  flex-direction: column;
  gap: 8px;
`;

export const AcceptedViewCardContainer = styled(ViewCardContainer)<{ $clickable: boolean }>`
  flex-direction: column;
  gap: 8px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
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

export const RelativeProfileSlot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const ChatInfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

export const ChatHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ChatGroupHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`;

export const ChatContainer = styled.div`
  display: flex;
  padding: 8px;
  justify-content: left;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  min-height: 38px;
  overflow: hidden;
  border-radius: 0 12px 12px 12px;
  background: var(--color-component-fill-strong);
`;

export const ChatPreviewViewport = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 22px;
  max-height: 36px;
  overflow: hidden;
`;

export const ChatPreviewText = styled(motion.div)`
  width: 100%;
`;

export const ChatPreviewLabel = styled(Label2)`
  display: -webkit-box;
  max-height: 36px;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: break-word;
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
  border: 1.5px solid var(--color-semantic-accent-foreground-orange); /* 오렌지 브라운 톤 */
  border-radius: 8px; /* 둥근 사각형 */
  width: 79px;
  height: 24px;
`;

export const TimerText = styled(Body1Bold)`
  font-size: var(--typography-caption-1-font-size);
  padding-left: 9px;
`;

export const TimerIcon = styled.img`
  width: 14px;
  height: 14px;
`;

export const TimerIconWithPadding = styled(TimerIcon)`
  padding-right: 2px;
`;

// 피그마 1203:10081 — 아바타 콜라주 컨테이너 (150×150, 절대좌표 배치)
export const AvatarCollage = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  flex-shrink: 0;
`;

export const CollageSlot = styled.div<{ $size: number; $left: number; $top: number }>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  left: ${p => p.$left}px;
  top: ${p => p.$top}px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid var(--color-semantic-background-normal-normal);
  background-color: var(--color-semantic-background-normal-alternative);
`;

export const FullSizeProfileImg = styled(ProfileImg)`
  width: 100%;
  height: 100%;
`;


export const GroupJoinedInner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  cursor: pointer;
`;

export const TopImgContainer = styled.div`
  display: grid;
  align-self: stretch;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

export const SmallProfileImg = styled(ProfileImg)`
  width: 40px;
  height: 40px;
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
  background: var(--color-semantic-primary-normal);
  backdrop-filter: blur(10px);
`;

//* BottomSheet
export const MeLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-semantic-inverse-background);
  width: 25px;
  height: 24px;
  border-radius: 6px;
`;

export const SelectImgDiv = styled.div`
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

export const LabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 4px;
  flex: 1 0 0;
`;

export const ProfileNameRow = styled.div`
  display: flex;
  gap: 12px;
`;

export const ProfileName = styled(Headline2)`
  padding-top: 2px;
`;

export const ChevronIcon = styled.img`
  width: 24px;
  height: 24px;
  opacity: 0.3;
  flex-shrink: 0;
`;

export const GroupTextColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

export const TimeLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const TimeIcon = styled.img`
  width: 16px;
  height: 16px;
`;

export const AcceptedProfileRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

// ✅ Local Styled Components for BottomSheet Profile
export const BSBadgeRowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const BSContentBadge = styled.div<{ $status: AlertStatus }>`
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
        return 'rgb(from var(--color-semantic-accent-foreground-Navy) r g b / 0.08)';
      case 'destructive':
      default:
        return 'rgba(179, 53, 40, 0.08)'; // var(--color-semantic-status-negative)
    }
  }};
  height: 24px;
`;

export const ProfileCardWrapper = styled.div`
  width: 100%;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--color-semantic-fill-normal);
  box-sizing: border-box;
`;

export const ListItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px; /* Gap between BadgeRow and ProfileCard */
  width: 100%;
`;

export const SelectableListItemContainer = styled(ListItemContainer)`
  cursor: pointer;
`;
