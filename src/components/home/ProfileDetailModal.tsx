"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import FullScreenModal from '../display/FullScreenModal';
import Nav from '../display/Nav';
import AlertModal from '../display/AlertModal';
import Toast from '../display/Toast';
import {
  Body2Reading,
  Body1Reading,
  Caption1,
  Heading2Bold,
  Headline2,
  Label1Normal,
  Label2
} from '../common/Text';
import { ActionButton, ActionSheet } from '../input/Action';

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M1.22496 6.99999C1.22496 3.81054 3.81051 1.22499 6.99994 1.22499C10.1894 1.22499 12.7749 3.81054 12.7749 6.99999C12.7749 10.1894 10.1894 12.775 6.99994 12.775C3.81051 12.775 1.22496 10.1894 1.22496 6.99999ZM9.71051 5.76089C9.91217 5.55255 9.90675 5.22018 9.69841 5.01853C9.49007 4.81687 9.1577 4.82229 8.95605 5.03063L6.22841 7.8487L5.04436 6.62205C4.84299 6.41344 4.51063 6.40757 4.30202 6.60894C4.0934 6.81031 4.08753 7.14267 4.2889 7.35129L5.85017 8.96871C5.94902 9.07112 6.08521 9.129 6.22754 9.12909C6.36987 9.12919 6.50614 9.0715 6.60513 8.96922L9.71051 5.76089Z" fill="currentColor" />
  </svg>
);

export default function ProfileDetailModal({
  isOpen,
  onClose,
  profile,
}: ProfileDetailModalProps) {
  console.log('[src/components/home/ProfileDetailModal.tsx] ProfileDetailModal'); // __component_log__
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<React.ReactNode | null>(null);
  const [isRequested, setIsRequested] = useState(false);

  if (!profile) return null;

  const handleRequestChat = () => {
    setIsAlertOpen(true);
  };

  const handleConfirmRequest = () => {
    // API 호출 대신 토스트만 발생
    setToastMessage('대화 신청을 완료했어요.');
    setIsRequested(true);
    setIsAlertOpen(false);
  };

  return (
    <>
      <FullScreenModal isOpen={isOpen} onClose={onClose}>
        <Nav prev={onClose} />

        <ContentBody>
          {/* Profile Hero Section */}
          <ProfileSection>
            <AvatarWrapper>
              <AvatarImg src={profile.avatarUrl} alt={profile.name} />
            </AvatarWrapper>

            {/* Name + Rating */}
            <NameRow>
              <Heading2Bold>{profile.name}</Heading2Bold>
              <RatingBadge>
                <RatingStar>★</RatingStar>
                <RatingText>4.5</RatingText>
              </RatingBadge>
            </NameRow>

            {/* Meta Info */}
            <Body2Reading $color="var(--color-semantic-label-alternative)" style={{ textAlign: 'center', marginTop: '4px' }}>
              {profile.ageRange} · {profile.gender} · {profile.location} · 유통/판매
            </Body2Reading>

            {/* Interest Badges */}
            <BadgeRow>
              <InterestBadge>
                <BadgeEmoji>🏃</BadgeEmoji>
                <Caption1>운동</Caption1>
              </InterestBadge>
              <InterestBadge>
                <BadgeEmoji>🎬</BadgeEmoji>
                <Caption1>영화/드라마</Caption1>
              </InterestBadge>
              <InterestBadge>
                <BadgeEmoji>🖼️</BadgeEmoji>
                <Caption1>전시</Caption1>
              </InterestBadge>
            </BadgeRow>
          </ProfileSection>

          {/* QnA Ticket Card */}
          <QnACard>
            {/* Decorative ticket edge */}
            <TicketDeco src="/assets/decoration/deco.svg" alt="" />

            {/* QnA Items */}
            <QnABody>
              <QnAItem>
                <QnAQuestion>Q5. 최근 1년 내 가장 잘한 선택은?</QnAQuestion>
                <QnAAnswer>퇴사하고 커피 공부한 것</QnAAnswer>
              </QnAItem>

              <QnADivider />

              <QnAItem>
                <QnAQuestion>Q6. 나를 가장 행복하게 만드는 순간은?</QnAQuestion>
                <QnAAnswer>새로운 여행지의 카페가보기</QnAAnswer>
              </QnAItem>

              <QnADivider />

              <QnAItem>
                <QnAQuestion>Q10. 나를 한 단어로 표현한다면?</QnAQuestion>
                <QnAAnswer>조용한 카페 탐방러</QnAAnswer>
              </QnAItem>

              <QnADivider />

              {/* More indicator dots */}
              <MoreDots>
                <Dot /><Dot /><Dot />
              </MoreDots>

              <MoreText>
                대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요
              </MoreText>
            </QnABody>
          </QnACard>
        </ContentBody>

        {/* Bottom Action Area */}
        <BottomActionContainer>
          <ActionSheet>
            {isRequested ? (
              <ActionButton
                variant="disabled"
                disabled={true}
                onClick={() => { }}
                icon={<CheckIcon />}
                style={{ backgroundColor: 'var(--color-semantic-interaction-disable, #DDD8D3)' }}
              >
                대화 신청 완료
              </ActionButton>
            ) : (
              <ActionButton
                variant="primary"
                onClick={handleRequestChat}
                icon={<img src="/icons/action/send.svg" alt="" />}
              >
                대화 신청하기
              </ActionButton>
            )}
          </ActionSheet>
        </BottomActionContainer>

        {/* Toast Overlay */}
        {toastMessage && (
          <ToastContainer>
            <Toast
              id="request-toast"
              message={toastMessage}
              type="none"
              onClose={() => setToastMessage(null)}
              duration={3000}
            />
          </ToastContainer>
        )}
      </FullScreenModal>

      {/* Confirmation Alert */}
      <AlertModal
        isOpen={isAlertOpen}
        title="대화를 신청할까요?"
        message="한 번 신청하면 취소할 수 없어요."
        confirmParams={{
          text: '네, 신청할게요',
          onClick: handleConfirmRequest,
        }}
        cancelParams={{
          text: '아니요',
          onClick: () => setIsAlertOpen(false),
        }}
        onClose={() => setIsAlertOpen(false)}
      />
    </>
  );
}

// --- Styled Components (Figma 3.2 소개노트 정밀 구현) ---

const ContentBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 0; /* Removed bottom padding here to let QnACard handle the gap */
  width: 100%;
`;

const AvatarWrapper = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  border: 1px solid rgba(108, 101, 95, 0.08);
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`;

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px; /* Increased from 2px */
`;

const RatingStar = styled.span`
  font-size: 14px;
  color: var(--color-semantic-status-positive, #557A55);
`;

const RatingText = styled(Label1Normal).attrs({ $weight: 'semibold' })`
  color: var(--color-semantic-status-positive, #557A55);
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const InterestBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: var(--color-semantic-fill-normal, rgba(108, 101, 95, 0.08));
`;

const BadgeEmoji = styled(Label2)`
`;

/* --- QnA Ticket Card --- */
const QnACard = styled.div`
  width: calc(100% - 32px);
  margin: 32px 16px 0; /* 32px space above QnA card */
  background-color: var(--color-semantic-background-elevated-alternative, #FAF8F5);
  border-radius: 12px;
  overflow: visible; /* Changed from hidden to show the overlapping ticket deco */
`;

const TicketDeco = styled.img`
  width: 80%;
  height: auto;
  display: block;
  margin: 0 auto;
  transform: translateY(-50%);
  margin-bottom: -14px; /* Adjust padding to offset the visual shift */
`;

const QnABody = styled.div`
  padding: 32px 16px 32px; /* Decreased top padding because of negative margin on TicketDeco */
  display: flex;
  flex-direction: column;
`;

const QnAItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const QnAQuestion = styled(Label1Normal).attrs({ $weight: 'semibold' })`
  color: var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61));
`;

const QnAAnswer = styled(Body1Reading)`
  color: var(--color-semantic-label-normal, #1A1815);
  padding: 0 16px;
`;

const QnADivider = styled.hr`
  margin: 24px 0;
  border: none;
  border-top: 1px dashed var(--color-semantic-line-normal-neutral, #C7C1B9);
`;

const MoreDots = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 24px 0 16px;
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-semantic-label-assistive, #B5AFA9);
`;

const MoreText = styled(Label1Normal).attrs({ $weight: 'semibold', $align: 'center' })`
  color: var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61));
  width: 100%;
  justify-content: center;
`;

const BottomActionContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 16px 34px 16px;
  pointer-events: none;
  z-index: 10;
  
  & > * {
    pointer-events: auto;
  }
`;

const ToastContainer = styled.div`
  position: absolute;
  bottom: 100px;
  left: 16px;
  right: 16px;
  z-index: 20;
`;
