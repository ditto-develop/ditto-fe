"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  getUserProfile,
  getUserIntroNotes,
  type PublicProfileDto,
  type IntroNoteAnswer,
} from "@/features/profile/api/profileApi";
import { formatAgeRange } from "@/shared/lib/formatAge";
import {
  toLocationLabel,
  toOccupationLabel,
  toInterestLabel,
} from "@/shared/lib/profileLabels";
import { TopNavigation } from "@/shared/ui";
import { GroupMemberMoreModal } from "./GroupMemberMoreModal";

interface GroupMemberProfilePageProps {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
  onClose: () => void;
}

export function GroupMemberProfilePage({
  userId,
  nickname,
  profileImageUrl,
  onClose,
}: GroupMemberProfilePageProps) {
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);
  const [introNotes, setIntroNotes] = useState<IntroNoteAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getUserProfile(userId), getUserIntroNotes(userId)])
      .then(([profileData, notes]) => {
        setProfile(profileData);
        setIntroNotes(notes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const avatarSrc =
    profile?.profileImageUrl || profileImageUrl || "/assets/avatar/m1.png";

  const metaText = profile
    ? [
        formatAgeRange(profile.age),
        profile.gender === "FEMALE" ? "여성" : "남성",
        profile.location ? toLocationLabel(profile.location) : null,
        profile.occupation ? toOccupationLabel(profile.occupation) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const interests = profile?.interests?.map(toInterestLabel) ?? [];

  return (
    <PageOverlay>
      <TopNavigation
        onBack={onClose}
        trailingElement={
          <MoreButton onClick={() => setIsMoreModalOpen(true)}>
            <img
              src="/icons/action/more-vertical.svg"
              alt="더보기"
              width={24}
              height={24}
            />
          </MoreButton>
        }
      />

      <ScrollContent>
        {loading ? (
          <LoadingText>불러오는 중...</LoadingText>
        ) : (
          <>
            <ProfileSection>
              <AvatarWrapper>
                <AvatarImg src={avatarSrc} alt={nickname} />
              </AvatarWrapper>

              <NameRow>
                <ProfileName>{nickname}</ProfileName>
                {profile?.rating != null && (
                  <RatingBadge>
                    <RatingStar>★</RatingStar>
                    <RatingText>{profile.rating}</RatingText>
                  </RatingBadge>
                )}
              </NameRow>

              {metaText && <ProfileMeta>{metaText}</ProfileMeta>}

              {interests.length > 0 && (
                <InterestRow>
                  {interests.map((interest) => (
                    <InterestBadge key={interest}>{interest}</InterestBadge>
                  ))}
                </InterestRow>
              )}
            </ProfileSection>

            {introNotes.length > 0 && (
              <QnACard>
                <TicketDeco src="/assets/decoration/deco.svg" alt="" />
                <QnABody>
                  {introNotes.map((item, i) => (
                    <IntroQAItem key={i}>
                      <IntroQAQuestion>{item.question}</IntroQAQuestion>
                      <IntroQAAnswer>{item.answer}</IntroQAAnswer>
                      {i < introNotes.length - 1 && <QnADivider />}
                    </IntroQAItem>
                  ))}
                </QnABody>
              </QnACard>
            )}
          </>
        )}
      </ScrollContent>

      {isMoreModalOpen && (
        <GroupMemberMoreModal
          onClose={() => setIsMoreModalOpen(false)}
          onReport={() => {
            // TODO: 신고하기 기능 추후 개발
            setIsMoreModalOpen(false);
          }}
        />
      )}
    </PageOverlay>
  );
}

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const PageOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
  animation: ${slideInRight} 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
`;

const MoreButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:active {
    opacity: 0.72;
  }
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const LoadingText = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
  margin: 0;
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 32px;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;
`;

const AvatarWrapper = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const ProfileName = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-title-3-font-size);
  font-weight: 700;
  line-height: 1.334;
  letter-spacing: -0.552px;
  color: var(--color-semantic-label-normal);
`;

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RatingStar = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-status-positive);
`;

const RatingText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: 1.429;
  color: var(--color-semantic-status-positive);
`;

const ProfileMeta = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const InterestRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

const InterestBadge = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  height: 28px;
  border-radius: 8px;
  background-color: var(--color-semantic-fill-normal);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  color: var(--color-semantic-label-alternative);
  box-sizing: border-box;
`;

const QnACard = styled.div`
  width: calc(100% - 32px);
  margin: 0 16px 32px;
  background-color: var(
    --color-semantic-background-elevated-alternative,
    var(--color-semantic-inverse-label)
  );
  border-radius: 8px;
  overflow: visible;
  display: flex;
  flex-direction: column;
`;

const TicketDeco = styled.img`
  width: 80%;
  height: auto;
  display: block;
  margin: 0 auto;
  transform: translateY(-50%);
  margin-bottom: -14px;
`;

const QnABody = styled.div`
  padding: 32px 16px 32px;
  display: flex;
  flex-direction: column;
`;

const IntroQAItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IntroQAQuestion = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: 1.429;
  letter-spacing: 0.203px;
  color: var(--color-semantic-label-alternative);
  margin: 0;
`;

const IntroQAAnswer = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.625;
  letter-spacing: 0.0912px;
  color: var(--color-semantic-label-normal);
  margin: 0;
  padding: 0 16px;
`;

const QnADivider = styled.hr`
  margin: 24px 0;
  border: none;
  border-top: 1px dashed var(--color-semantic-line-normal-neutral);
  width: 100%;
`;
