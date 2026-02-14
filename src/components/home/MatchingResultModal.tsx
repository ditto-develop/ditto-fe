"use client";

import React from 'react';
import styled from 'styled-components';
import FullScreenModal from '../display/FullScreenModal'; // Adjust import path if needed
import Nav from '../display/Nav';
import ProfileDetailModal from './ProfileDetailModal';
import {
    Heading2Bold,
    Body2Normal,
    Caption1,
    Caption2,
    Label2,
    Headline2
} from '../common/Text';
import { AlertStatus } from '../display/Card'; // Reuse AlertStatus type

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
        avatarUrl: '/onboarding/profileimg/avatar/f1.svg', // Placeholder
        badgeText: '🌟 당신과 가장 비슷해요',
        badgeColor: 'destructive', // Red
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
        avatarUrl: '/onboarding/profileimg/avatar/f2.svg', // Placeholder
        badgeText: '😊 대부분 비슷하게 생각해요',
        badgeColor: 'destructive', // Red (Figma shows red/negative for this one too)
        statusText: '상대가 대화를 신청했어요',
        statusColor: 'var(--color-semantic-status-positive)',
    },
    {
        id: '3',
        name: '와그작',
        ageRange: '35~39세',
        gender: '남성',
        location: '서울',
        bio: '게임, UFC 좋아해요',
        matchCount: 7,
        totalQuestions: 12,
        avatarUrl: '/onboarding/profileimg/avatar/m1.svg', // Placeholder
        badgeText: '🙂 비슷하지만 새로운 관점도 있어요',
        badgeColor: 'cautionary', // Orange
        statusText: '내가 대화를 신청했어요',
        statusColor: 'var(--color-semantic-label-neutral)',
    },
    {
        id: '4',
        name: '???', // Name not shown in snippet but implies 4th item
        ageRange: '??',
        gender: '??',
        location: '??',
        bio: '???',
        matchCount: 5,
        totalQuestions: 12,
        avatarUrl: '/onboarding/profileimg/avatar/m2.svg',
        badgeText: '👀 다르게 생각하는 편이에요',
        badgeColor: 'navy',
    }
];

export default function MatchingResultModal({ isOpen, onClose }: MatchingResultModalProps) {
    const [selectedProfile, setSelectedProfile] = React.useState<MatchProfile | null>(null);

    return (
        <>
            <FullScreenModal isOpen={isOpen} onClose={onClose}>
                {/* 1. Navigation */}
                <Nav prev={onClose} />

                {/* 2. Header Content */}
                <HeaderContainer>

                    <TitleSection>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* Icon placeholder or just text */}
                            <Caption2 $color="var(--color-semantic-accent-foreground-vintage-pink, #956B72)">1:1 매칭</Caption2>
                        </div>
                        <Heading2Bold style={{ fontSize: '24px', margin: '4px 0 8px 0' }}>이번 주 매칭 결과</Heading2Bold>
                        <Body2Normal $color="var(--color-semantic-label-neutral)" style={{ whiteSpace: 'pre-wrap' }}>
                            나와 가장 비슷한 답을 한 사람들을 찾았어요.{'\n'}
                            서로를 선택한 단 한사람과 대화를 나눌 수 있어요.
                        </Body2Normal>
                    </TitleSection>
                </HeaderContainer>

                {/* 2. Content Body (List of Profiles) */}
                <ContentBody>
                    {MOCK_PROFILES.map((profile) => (
                        <ProfileCard key={profile.id} onClick={() => setSelectedProfile(profile)} style={{ cursor: 'pointer' }}>
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
                                        <img src="/home/icons/chevron-right.svg" alt="Detail" width={24} height={24} style={{ opacity: 0.3 }} />
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
                                        {/* Icon could go here */}
                                        <Caption1 style={{ color: profile.statusColor, fontWeight: 500 }}>
                                            {profile.statusText}
                                        </Caption1>
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

const ContentBody = styled.div`
  flex: 1;
  padding: 32px 16px; // Top padding matches design "py-[32px]"
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding-bottom: 50px; // Extra space at bottom
`;

const ProfileCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  background-color: var(--color-semantic-fill-normal, rgba(108, 101, 95, 0.08));
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
  background-color: var(--color-semantic-background-normal-alternative, #ddd8d3);
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

const StatusOverlay = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
`;
