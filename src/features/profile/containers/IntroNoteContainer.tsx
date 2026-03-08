"use client";

import styled from "styled-components";
import { TopNavigation } from "@/shared/ui/TopNavigation";
import { Avatar } from "@/shared/ui/Avatar";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { ContentBadge } from "@/shared/ui/ContentBadge";
import { BottomActionArea } from "@/shared/ui/BottomActionArea";
import type { ProfileInfo, QuizAnswer, IntroNoteState } from "@/features/profile";

/**
 * IntroNoteContainer — Figma: 3.2 소개노트
 * 대화 신청 전 / 대화 수락 공유 페이지 셸.
 * state에 따라 하단 CTA만 다름.
 */
export default function IntroNoteContainer({
    profile,
    quizAnswers,
    state,
    onBack,
    onRequest,
    onAccept,
    onReject,
}: {
    profile: ProfileInfo;
    quizAnswers: QuizAnswer[];
    state: IntroNoteState;
    onBack: () => void;
    onRequest?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
}) {
    return (
        <PageContainer>
            <TopNavigation onBack={onBack} />

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
                    {profile.age}세 · {profile.gender} · {profile.location}
                    {profile.occupation && ` · ${profile.occupation}`}
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
                    {quizAnswers.map((qa, idx) => (
                        <QAItem key={qa.questionNumber}>
                            <QAQuestion>
                                Q{qa.questionNumber}. {qa.question}
                            </QAQuestion>
                            <QAAnswer>{qa.answer}</QAAnswer>
                            {idx < quizAnswers.length - 1 && <QADivider />}
                        </QAItem>
                    ))}

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

            {/* Bottom Action Area — state-dependent */}
            <ActionSpacer />
            <BottomActionArea>
                {state === "before_request" ? (
                    <PrimaryButton onClick={onRequest}>
                        <ButtonIcon>▶</ButtonIcon>
                        대화 신청하기
                    </PrimaryButton>
                ) : (
                    <>
                        <SecondaryButton onClick={onReject}>
                            거절하기
                        </SecondaryButton>
                        <PrimaryButton onClick={onAccept}>
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
  position: relative;
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
`;

const QAItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const QAQuestion = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-semantic-label-alternative);
`;

const QAAnswer = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-semantic-label-strong);
  padding-left: 16px;
`;

const QADivider = styled.hr`
  margin: 0;
  margin-top: 20px;
  border: none;
  border-top: 1px solid var(--color-semantic-line-normal-neutral);
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

  &:active {
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

  &:active {
    opacity: 0.9;
  }
`;
