"use client";

import React from 'react';
import styled from 'styled-components';
import { FullScreenModal } from "@/components/display/FullScreenModal"; // Adjust import path if needed
import { Nav } from "@/components/display/Nav";
import { ProfileDetailModal } from "@/components/home/ProfileDetailModal";
import {
    Heading2Bold,
    Body2Normal,
    Caption1,
    Caption2,
    Label2,
    Headline2
} from "@/components/common/Text";
import type { AlertStatus } from "@/components/display/Card"; // Reuse AlertStatus type

// --- Types ---
interface MatchingResultModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MatchProfile {
    id: string;
    name: string;
    ageRange: string;
    gender: string;
    location: string;
    bio: string;
    matchCount: number;
    totalQuestions: number;
    avatarUrl: string;
    badgeText: string;
    badgeColor: AlertStatus;
    statusText?: string; // e.g. "상대가 대화를 신청했어요"
    statusColor?: string; // e.g. "var(--color-semantic-status-positive)"
    statusIcon?: string; // e.g. "▸" or "✓"
}

// --- Mock Data (matching Figma) ---
const MOCK_PROFILES: MatchProfile[] = [
    {
        id: '1',
        name: '사부작사부작',
        ageRange: '25~29세',
        gender: '여성',
        location: '서울',
        bio: '느긋한 집순이',
        matchCount: 11,
        totalQuestions: 12,
        avatarUrl: '/assets/avatar/f1.png',
        badgeText: '🌟 당신과 가장 비슷해요',
        badgeColor: 'destructive',
        statusText: '상대가 대화를 신청했어요',
        statusColor: 'var(--color-semantic-status-positive)',
        statusIcon: '/icons/status/send-fill.svg',
    },
    {
        id: '2',
        name: '커피홀릭',
        ageRange: '30~34세',
        gender: '여성',
        location: '서울',
        bio: '조용한 카페 탐방러',
        matchCount: 9,
        totalQuestions: 12,
        avatarUrl: '/assets/avatar/f2.png',
        badgeText: '😊 대부분 비슷하게 생각해요',
        badgeColor: 'cautionary',
        statusText: '내가 대화를 신청했어요',
        statusColor: 'var(--color-semantic-label-neutral)',
        statusIcon: '/icons/status/circle-check-fill.svg',
    },
    {
        id: '3',
        name: 'Lemon Tea',
        ageRange: '30~34세',
        gender: '여성',
        location: '서울',
        bio: '느긋한 집순이',
        matchCount: 7,
        totalQuestions: 12,
        avatarUrl: '/assets/avatar/f5.png',
        badgeText: '🙂 비슷하지만 새로운 관점도 있어요',
        badgeColor: 'cautionary',
    },
    {
        id: '4',
        name: '와그작',
        ageRange: '35~39세',
        gender: '남성',
        location: '서울',
        bio: '게임, UFC 좋아해요',
        matchCount: 5,
        totalQuestions: 12,
        avatarUrl: '/assets/avatar/m3.png',
        badgeText: '👀 다르게 생각하는 편이에요',
        badgeColor: 'navy',
    }
];

export function MatchingResultModal({ isOpen, onClose }: MatchingResultModalProps) {
  console.log('[src/components/home/MatchingResultModal.tsx] MatchingResultModal'); // __component_log__
    const [selectedProfile, setSelectedProfile] = React.useState<MatchProfile | null>(null);

    return (
        <>
            <FullScreenModal isOpen={isOpen} onClose={onClose}>
                {/* 1. Navigation */}
                <Nav prev={onClose} />

                {/* 2. Header Content */}
                <HeaderContainer>

                    <TitleSection>
                        <MatchTypeRow>
                            <img src="/icons/content/people.svg" alt="" width={16} height={16} />
                            <Caption2 $color="var(--color-semantic-accent-foreground-vintage-pink)">1:1 매칭</Caption2>
                        </MatchTypeRow>
                        <ResultTitle>이번 주 매칭 결과</ResultTitle>
                        <ResultDescription $color="var(--color-semantic-label-neutral)">
                            나와 가장 비슷한 답을 한 사람들을 찾았어요.{'\n'}
                            서로를 선택한 단 한사람과 대화를 나눌 수 있어요.
                        </ResultDescription>
                    </TitleSection>
                </HeaderContainer>

                {/* 2. Content Body (List of Profiles) */}
                <ContentBody>
                    {MOCK_PROFILES.map((profile) => (
                        <ProfileCard key={profile.id} onClick={() => setSelectedProfile(profile)}>
                            {/* Badge Row */}
                            <BadgeRow>
                                <Badge $status={profile.badgeColor}>
                                    <Caption1 $color={getBadgeTextColor(profile.badgeColor)}>
                                        {profile.badgeText}
                                    </Caption1>
                                </Badge>
                                <Caption2 $color="var(--color-semantic-label-alternative)">
                                    {profile.totalQuestions}개중 {profile.matchCount}개 일치
                                </Caption2>
                            </BadgeRow>

                            {/* Profile Info Card */}
                            <InfoCard>
                                <AvatarWrapper>
                                    <AvatarImg src={profile.avatarUrl} alt={profile.name} />
                                </AvatarWrapper>

                                <TextInfo>
                                    <NameRow>
                                        <Headline2>{profile.name}</Headline2>
                                        <ChevronIcon src="/icons/navigation/chevron-right.svg" alt="Detail" width={24} height={24} />
                                    </NameRow>
                                    <Label2 $color="var(--color-semantic-label-alternative)">
                                        {profile.ageRange} · {profile.gender} · {profile.location}
                                    </Label2>
                                    <Label2 $color="var(--color-semantic-label-alternative)">
                                        {profile.bio}
                                    </Label2>
                                </TextInfo>

                                {/* Status Text (if any) */}
                                {profile.statusText && (
                                    <StatusOverlay>
                                        {profile.statusIcon && (
                                            <StatusIconImg src={profile.statusIcon} alt="" width={12} height={12} />
                                        )}
                                        <StatusText $statusColor={profile.statusColor}>
                                            {profile.statusText}
                                        </StatusText>
                                    </StatusOverlay>
                                )}
                            </InfoCard>
                        </ProfileCard>
                    ))}
                </ContentBody>
            </FullScreenModal>

            {/* Profile Detail Modal */}
            <ProfileDetailModal
                isOpen={!!selectedProfile}
                onClose={() => setSelectedProfile(null)}
                profile={selectedProfile}
                isAlreadyRequested={selectedProfile?.statusText === '내가 대화를 신청했어요'}
            />
        </>
    );
}

// --- Helpers ---
const getBadgeTextColor = (status: AlertStatus) => {
    switch (status) {
        case 'destructive':
        default: return 'var(--color-semantic-status-negative)';
        case 'cautionary': return 'var(--color-semantic-status-cautionary)';
        case 'navy': return 'var(--color-semantic-accent-foreground-Navy)';
    }
};

// --- Styled Components ---

const HeaderContainer = styled.div`
  padding: 0 16px 16px 16px; // Adjusted padding since Nav is separate
  background-color: var(--color-semantic-background-normal-normal);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const MatchTypeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ResultTitle = styled(Heading2Bold)`
  font-size: var(--typography-title-3-font-size);
  margin: 4px 0 8px 0;
`;

const ResultDescription = styled(Body2Normal)`
  white-space: pre-wrap;
`;

const ContentBody = styled.div`
  flex: 1;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding-bottom: 50px;
  background-color: var(--color-semantic-background-normal-normal);
`;

const ProfileCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
`;

const BadgeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Badge = styled.div<{ $status: AlertStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  height: 24px;
  border-radius: 6px;
  background-color: ${({ $status }) => {
        switch ($status) {
            case 'positive': return 'rgba(85, 122, 85, 0.08)';
            case 'cautionary': return 'rgba(192, 110, 28, 0.08)';
            case 'navy': return 'rgba(55, 96, 126, 0.08)';
            case 'destructive':

            default: return 'rgba(179, 53, 40, 0.08)';
        }
    }};
`;

const InfoCard = styled.div`
  background-color: var(--color-semantic-fill-normal);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start; // Align top
  gap: 16px;
  position: relative;
`;

const AvatarWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-alternative);
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(108, 101, 95, 0.08);
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TextInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NameRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ChevronIcon = styled.img`
  opacity: 0.3;
`;

const StatusOverlay = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const StatusText = styled(Caption1)<{ $statusColor?: string }>`
  color: ${({ $statusColor }) => $statusColor ?? 'var(--color-semantic-label-neutral)'};
  font-weight: 500;
`;

const StatusIcon = styled.span`
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-status-positive);
`;

const StatusIconImg = styled.img`
  flex-shrink: 0;
`;
