"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { TopNavigation } from "@/shared/ui/TopNavigation";
import { Avatar } from "@/shared/ui/Avatar";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { ContentBadge } from "@/shared/ui/ContentBadge";
import { BottomActionArea } from "@/shared/ui/BottomActionArea";
import type { IntroNoteState } from "@/features/profile";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";
import {
    sendMatchRequest,
    acceptMatchRequest,
    rejectMatchRequest,
} from "@/features/matching/api/matchingApi";

/**
 * IntroNoteContainer — Figma: 3.2 소개노트
 * 실제 API 연결 + 상태별 버튼 (before_request / after_acceptance / completed)
 */
export default function IntroNoteContainer({
    userId,
    quizSetId,
    matchRequestId,
    initialState,
    onBack,
}: {
    userId: string;
    quizSetId?: string;
    matchRequestId?: string;
    initialState: IntroNoteState;
    onBack: () => void;
}) {
  console.log('[src/features/profile/containers/IntroNoteContainer.tsx] IntroNoteContainer'); // __component_log__
    const router = useRouter();
    const { profile, loading, error } = useUserProfile(userId);
    const [state, setState] = useState<IntroNoteState>(initialState);
    const [acting, setActing] = useState(false);

    // userId가 바뀔 때(다른 프로필로 이동) 상태 초기화
    useEffect(() => {
        setState(initialState);
    }, [userId]);

    async function handleRequest() {
        if (!quizSetId || acting) return;
        setActing(true);
        try {
            await sendMatchRequest(userId, quizSetId);
            setState("completed");
        } finally {
            setActing(false);
        }
    }

    async function handleAccept() {
        if (!matchRequestId || acting) return;
        setActing(true);
        try {
            await acceptMatchRequest(matchRequestId);
            router.push("/home");
        } finally {
            setActing(false);
        }
    }

    async function handleReject() {
        if (!matchRequestId || acting) return;
        setActing(true);
        try {
            await rejectMatchRequest(matchRequestId);
            router.push("/home");
        } finally {
            setActing(false);
        }
    }

    return (
        <PageContainer>
            <TopNavigation onBack={onBack} />

            {loading && <StateText>프로필을 불러오는 중...</StateText>}
            {error && <StateText>프로필을 불러오지 못했어요.</StateText>}

            {profile && (
                <>
                    {/* Profile Hero Section */}
                    <ProfileSection>
                        <Avatar src={profile.avatarUrl} size="xl" />

                        <ProfileName>
                            {profile.nickname}
                            {profile.rating && (
                                <RatingBadge>
                                    <RatingStar>★</RatingStar>
                                    {profile.rating}
                                </RatingBadge>
                            )}
                        </ProfileName>

                        <ProfileMeta>
                            {profile.age}세 · {profile.gender}
                            {profile.location ? ` · ${profile.location}` : ""}
                            {profile.occupation ? ` · ${profile.occupation}` : ""}
                        </ProfileMeta>

                        {profile.interests.length > 0 && (
                            <InterestRow>
                                {profile.interests.map((interest) => (
                                    <ContentBadge key={interest} variant="neutral">
                                        {interest}
                                    </ContentBadge>
                                ))}
                            </InterestRow>
                        )}
                    </ProfileSection>

                    {/* Quiz Answers Card */}
                    <QASection>
                        <DottedDeco />
                        <QAContainer>
                            <MoreIndicator>
                                <Dot />
                                <Dot />
                                <Dot />
                            </MoreIndicator>
                            <MoreText>
                                대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요
                            </MoreText>
                        </QAContainer>
                    </QASection>
                </>
            )}

            {/* Bottom Action Area — state-dependent */}
            <ActionSpacer />
            <BottomActionArea>
                {state === "completed" ? (
                    <CompletedArea>
                        <CompletedText>✓ 대화 신청 완료</CompletedText>
                    </CompletedArea>
                ) : state === "before_request" ? (
                    <PrimaryButton onClick={handleRequest} disabled={acting}>
                        <ButtonIcon>▶</ButtonIcon>
                        대화 신청하기
                    </PrimaryButton>
                ) : (
                    <>
                        <SecondaryButton onClick={handleReject} disabled={acting}>
                            거절하기
                        </SecondaryButton>
                        <PrimaryButton onClick={handleAccept} disabled={acting}>
                            대화 수락하기
                        </PrimaryButton>
                    </>
                )}
            </BottomActionArea>
        </PageContainer>
    );
}

// --- Styled Components ---
const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-semantic-background-normal-alternative, #E9E6E2);
  padding-bottom: 100px;
`;

const StateText = styled.p`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  gap: 8px;
`;

const ProfileName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-semantic-label-strong);
`;

const RatingBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-semantic-status-positive, #557A55);
`;

const RatingStar = styled.span`
  color: var(--color-semantic-status-positive, #557A55);
`;

const ProfileMeta = styled.span`
  font-size: 15px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const InterestRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const QASection = styled.div`
  margin: 0 16px;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  border-radius: 8px;
  padding: 0 16px 16px;
`;

const DottedDeco = styled.div`
  height: 14px;
  border-bottom: 2px dashed var(--color-semantic-line-normal-neutral);
  margin: 0 8px;
`;

const QAContainer = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
`;

const MoreIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-semantic-label-assistive);
`;

const MoreText = styled.span`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const ActionSpacer = styled.div`
  height: 16px;
`;

const CompletedArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
`;

const CompletedText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-semantic-label-alternative);
`;

const PrimaryButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background-color: var(--color-semantic-primary-normal, #1A1815);
  color: var(--color-semantic-inverse-label, #FAF9F7);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:active:not(:disabled) {
    opacity: 0.9;
  }
`;

const ButtonIcon = styled.span`
  font-size: 14px;
`;

const SecondaryButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px solid var(--color-semantic-line-normal-normal);
  border-radius: 12px;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  color: var(--color-semantic-label-normal);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:active:not(:disabled) {
    opacity: 0.9;
  }
`;
