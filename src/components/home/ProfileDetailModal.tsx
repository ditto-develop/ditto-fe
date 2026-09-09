"use client";

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FullScreenModal } from "@/shared/ui";
import { Nav } from "@/shared/ui";
import { AlertModal } from "@/shared/ui";
import { ProfileIntroView } from '@/features/profile/ui/ProfileIntroView';
import { ActionButton, ActionSheet } from "@/components/input/Action";
import {
  getUserProfile,
  getUserIntroNotes,
  getUserRatingSummary,
  type IntroNoteAnswer,
} from '@/features/profile/api/profileApi';
import type { RatingSummary } from '@/features/profile/model/types';
import { toLocationLabel, toOccupationLabel, toInterestLabel } from '@/shared/lib/profileLabels';
import { useToast } from '@/context/ToastContext';

export interface ProfileDetailProfile {
  id?: string;
  userId?: string;
  name: string;
  avatarUrl?: string | null;
  age?: number;
  ageRange?: string;
  gender?: string;
  location?: string | null;
  bio?: string | null;
  matchCount?: number;
  statusText?: string;
  statusIcon?: string;
  statusColor?: string;
}

interface ProfileDetailData {
  profileId: string;
  introNotes: IntroNoteAnswer[];
  interests: string[];
  rating?: number;
  ratingSummary?: RatingSummary | null;
  occupation?: string;
}

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileDetailProfile | null;
  hideCta?: boolean;
  isAlreadyRequested?: boolean;
  /** 매칭이 성사된 상대: 미리보기(3개)가 아니라 소개노트 전체를 보여 준다. */
  showAllNotes?: boolean;
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M1.22496 6.99999C1.22496 3.81054 3.81051 1.22499 6.99994 1.22499C10.1894 1.22499 12.7749 3.81054 12.7749 6.99999C12.7749 10.1894 10.1894 12.775 6.99994 12.775C3.81051 12.775 1.22496 10.1894 1.22496 6.99999ZM9.71051 5.76089C9.91217 5.55255 9.90675 5.22018 9.69841 5.01853C9.49007 4.81687 9.1577 4.82229 8.95605 5.03063L6.22841 7.8487L5.04436 6.62205C4.84299 6.41344 4.51063 6.40757 4.30202 6.60894C4.0934 6.81031 4.08753 7.14267 4.2889 7.35129L5.85017 8.96871C5.94902 9.07112 6.08521 9.129 6.22754 9.12909C6.36987 9.12919 6.50614 9.0715 6.60513 8.96922L9.71051 5.76089Z" fill="currentColor" />
  </svg>
);

export function ProfileDetailModal({
  isOpen,
  onClose,
  profile,
  hideCta = false,
  isAlreadyRequested = false,
  showAllNotes = false,
}: ProfileDetailModalProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [requestedProfileKey, setRequestedProfileKey] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ProfileDetailData | null>(null);
  const { showToast } = useToast();
  const profileId = profile?.id ?? profile?.userId;
  const profileKey = profileId ?? profile?.name ?? null;
  const isRequested = isAlreadyRequested || (profileKey !== null && requestedProfileKey === profileKey);

  useEffect(() => {
    if (!isOpen || !profileId) return;
    let cancelled = false;

    Promise.all([
      getUserProfile(profileId).catch(() => null),
      getUserIntroNotes(profileId).catch(() => []),
      // 열람 권한은 프로필과 같다 — 프로필이 보이는데 평가만 403인 경우는 없다.
      // 그래도 평가 하나 때문에 화면 전체를 비우지는 않는다.
      getUserRatingSummary(profileId).catch(() => null),
    ]).then(([dto, notes, ratingSummary]) => {
      if (cancelled) return;
      setDetailData({
        profileId,
        introNotes: notes,
        interests: (dto?.interests ?? []).map(toInterestLabel),
        rating: dto?.rating,
        ratingSummary,
        occupation: dto?.occupation ? toOccupationLabel(dto.occupation) : undefined,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, profileId]);

  if (!profile) return null;

  const currentDetailData = detailData?.profileId === profileId ? detailData : null;
  const metaText = [profile.ageRange, profile.gender, profile.location ? toLocationLabel(profile.location) || profile.location : undefined, currentDetailData?.occupation]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <FullScreenModal isOpen={isOpen} onClose={onClose}>
        <Nav prev={onClose} />

        <ContentBody>
          <ProfileIntroView
            avatarUrl={profile.avatarUrl ?? '/assets/avatar/m1.png'}
            name={profile.name}
            rating={currentDetailData?.rating}
            metaText={metaText}
            interests={currentDetailData?.interests ?? []}
            introNotes={currentDetailData?.introNotes ?? []}
            ratingSummary={currentDetailData?.ratingSummary}
            showAllNotes={showAllNotes}
          />
        </ContentBody>

        {!hideCta && (
          <BottomActionContainer>
            <ActionSheet>
              {isRequested ? (
                <DisabledRequestButton
                  variant="disabled"
                  disabled={true}
                  onClick={() => {}}
                  icon={<CheckIcon />}
                >
                  대화 신청 완료
                </DisabledRequestButton>
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
      </FullScreenModal>

      <AlertModal
        isOpen={isAlertOpen}
        title="대화를 신청할까요?"
        message="한 번 신청하면 취소할 수 없어요."
        confirmParams={{
          text: '네, 신청할게요',
          onClick: () => {
            showToast('대화 신청을 완료했어요.', 'none', {
              id: 'request-toast',
              duration: 3000,
            });
            setRequestedProfileKey(profileKey);
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
  background-color: var(--color-semantic-background-normal-normal);
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

const DisabledRequestButton = styled(ActionButton)`
  background-color: var(--color-semantic-interaction-disable);
`;
