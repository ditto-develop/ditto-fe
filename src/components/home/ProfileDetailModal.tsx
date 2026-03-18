"use client";

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import FullScreenModal from '../display/FullScreenModal';
import Nav from '../display/Nav';
import AlertModal from '../display/AlertModal';
import Toast from '../display/Toast';
import ProfileIntroView from '@/features/profile/ui/ProfileIntroView';
import { ActionButton, ActionSheet } from '../input/Action';

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  hideCta?: boolean;
  isAlreadyRequested?: boolean;
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
  hideCta = false,
  isAlreadyRequested = false,
}: ProfileDetailModalProps) {
  console.log('[src/components/home/ProfileDetailModal.tsx] ProfileDetailModal'); // __component_log__
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<React.ReactNode | null>(null);
  const [isRequested, setIsRequested] = useState(isAlreadyRequested);

  useEffect(() => {
    setIsRequested(isAlreadyRequested);
  }, [isAlreadyRequested, profile]);

  if (!profile) return null;

  const metaText = [profile.ageRange, profile.gender, profile.location, '유통/판매']
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <FullScreenModal isOpen={isOpen} onClose={onClose}>
        <Nav prev={onClose} />

        <ContentBody>
          <ProfileIntroView
            avatarUrl={profile.avatarUrl}
            name={profile.name}
            rating={4.5}
            metaText={metaText}
            interests={['🏃 운동', '🎬 영화/드라마', '🖼️ 전시']}
            introNotes={[
              { question: 'Q5. 최근 1년 내 가장 잘한 선택은?', answer: '퇴사하고 커피 공부한 것' },
              { question: 'Q6. 나를 가장 행복하게 만드는 순간은?', answer: '새로운 여행지의 카페가보기' },
              { question: 'Q10. 나를 한 단어로 표현한다면?', answer: '조용한 카페 탐방러' },
            ]}
          />
        </ContentBody>

        {!hideCta && (
          <BottomActionContainer>
            <ActionSheet>
              {isRequested ? (
                <ActionButton
                  variant="disabled"
                  disabled={true}
                  onClick={() => {}}
                  icon={<CheckIcon />}
                  style={{ backgroundColor: 'var(--color-semantic-interaction-disable, #DDD8D3)' }}
                >
                  대화 신청 완료
                </ActionButton>
              ) : (
                <ActionButton
                  variant="primary"
                  onClick={() => setIsAlertOpen(true)}
                  icon={<img src="/icons/action/send.svg" alt="" />}
                >
                  대화 신청하기
                </ActionButton>
              )}
            </ActionSheet>
          </BottomActionContainer>
        )}

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

      <AlertModal
        isOpen={isAlertOpen}
        title="대화를 신청할까요?"
        message="한 번 신청하면 취소할 수 없어요."
        confirmParams={{
          text: '네, 신청할게요',
          onClick: () => {
            setToastMessage('대화 신청을 완료했어요.');
            setIsRequested(true);
            setIsAlertOpen(false);
          },
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

const ContentBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
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
