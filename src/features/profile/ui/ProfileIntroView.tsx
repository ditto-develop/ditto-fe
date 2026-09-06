"use client";

import { useMemo } from "react";
import styled from "styled-components";

import type { RatingSummary } from "@/features/profile/model/types";

type IntroNotePreviewItem = {
    questionCode?: string;
    question: string;
    answer: string;
};

export interface ProfileIntroViewProps {
    avatarUrl: string;
    name: string;
    rating?: number | string;
    metaText: string; // e.g. "30-34세 · 여성 · 서울 · 유통/판매"
    interests: string[];
    introNotes: IntroNotePreviewItem[];
    ratingSummary?: RatingSummary | null;
    hasBottomButton?: boolean;
}

export function ProfileIntroView({
    avatarUrl,
    name,
    rating,
    metaText,
    interests,
    introNotes,
    ratingSummary,
    hasBottomButton = true,
}: ProfileIntroViewProps) {
    const previewNotes = useMemo(() => selectIntroNotePreview(introNotes), [introNotes]);
    // 서버는 공개 여부 플래그를 주지 않는다 — 기준은 totalCount >= publicThreshold 하나뿐이고,
    // 내 프로필(ReceivedRatingsCard)과 같은 판정이라 두 화면이 어긋나지 않는다.
    const publicRatingSummary =
        ratingSummary && ratingSummary.totalCount >= ratingSummary.publicThreshold
            ? ratingSummary
            : null;
    const ratingComments = publicRatingSummary?.ratings
        ?.map((item) => item.comment?.trim())
        .filter((comment): comment is string => Boolean(comment))
        .slice(0, 3) ?? [];
    const hiddenRatingCount = publicRatingSummary
        ? Math.max(publicRatingSummary.totalCount - ratingComments.length, 0)
        : 0;

    return (
        <>
            <ProfileSection>
                <AvatarWrapper>
                    <AvatarImg src={avatarUrl} alt={name} />
                </AvatarWrapper>

                <NameRow>
                    <ProfileName>{name}</ProfileName>
                    {rating && (
                        <RatingBadge>
                            <RatingStar>★</RatingStar>
                            <RatingText>{rating}</RatingText>
                        </RatingBadge>
                    )}
                </NameRow>

                {metaText && (
                    <ProfileMeta>{metaText}</ProfileMeta>
                )}

                {interests.length > 0 && (
                    <InterestRow>
                        {interests.map((interest) => (
                            <InterestBadge key={interest}>{interest}</InterestBadge>
                        ))}
                    </InterestRow>
                )}
            </ProfileSection>

            <QnACard $compact={Boolean(publicRatingSummary)}>
                <TicketDeco src="/assets/decoration/deco.svg" alt="" />
                <QnABody $compact={Boolean(publicRatingSummary)} $hasBottomButton={hasBottomButton}>
                    {previewNotes.map((item, i) => (
                        <IntroQAItem key={item.questionCode ?? item.question} data-testid="intro-note-preview-item">
                            <IntroQAQuestion>{item.question}</IntroQAQuestion>
                            <IntroQAAnswer>{item.answer}</IntroQAAnswer>
                            {i < previewNotes.length - 1 && <QnADivider $compact={Boolean(publicRatingSummary)} />}
                        </IntroQAItem>
                    ))}
                    {previewNotes.length > 0 && <QnADivider $compact={Boolean(publicRatingSummary)} />}
                    <MoreIndicator $compact={Boolean(publicRatingSummary)}>
                        <Dot /><Dot /><Dot />
                    </MoreIndicator>
                    <MoreText>
                        대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요
                    </MoreText>
                </QnABody>
            </QnACard>

            {publicRatingSummary && (
                <RatingSummaryCard>
                    <RatingSummaryTitle>받은 평가</RatingSummaryTitle>
                    <RatingScoreRow>
                        <RatingStars aria-hidden="true">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <RatingStarIcon key={index}>★</RatingStarIcon>
                            ))}
                        </RatingStars>
                        <RatingScoreText>{publicRatingSummary.averageScore.toFixed(1)}</RatingScoreText>
                        <RatingCountText>({publicRatingSummary.totalCount})</RatingCountText>
                    </RatingScoreRow>
                    {ratingComments.length > 0 && (
                        <RatingChipRow>
                            {ratingComments.map((comment) => (
                                <RatingChip key={comment}>{comment}</RatingChip>
                            ))}
                            {hiddenRatingCount > 0 && <RatingMoreChip>+{hiddenRatingCount}</RatingMoreChip>}
                        </RatingChipRow>
                    )}
                </RatingSummaryCard>
            )}
        </>
    );
}

function selectIntroNotePreview(introNotes: IntroNotePreviewItem[]): IntroNotePreviewItem[] {
    const oneWordNote = introNotes.find((item) => item.questionCode === "one-word" || item.question.startsWith("Q10."));
    const candidates = introNotes.filter((item) => item !== oneWordNote);
    const shuffled = shuffleIntroNotes(candidates);

    return oneWordNote
        ? [...shuffled.slice(0, 2), oneWordNote]
        : shuffled.slice(0, 3);
}

function shuffleIntroNotes(introNotes: IntroNotePreviewItem[]): IntroNotePreviewItem[] {
    const shuffled = [...introNotes];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const AvatarWrapper = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-normal);
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

const ProfileName = styled.span`
  font-size: var(--typography-title-3-font-size);
  font-weight: 700;
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
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  color: var(--color-semantic-status-positive);
`;

const ProfileMeta = styled.span`
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  line-height: 1.5;
  margin-top: 4px;
  width: 100%;
  max-width: 100%;
`;

const InterestRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
`;

const InterestBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: var(--color-semantic-fill-normal);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  color: var(--color-semantic-label-alternative);
`;

const QnACard = styled.div<{ $compact?: boolean }>`
  flex: ${({ $compact }) => ($compact ? "0 0 auto" : "1")};
  min-height: ${({ $compact }) => ($compact ? "auto" : "0")};
  width: calc(100% - 32px);
  margin: ${({ $compact }) => ($compact ? "var(--space-5) var(--space-4) 0" : "32px 16px 0")};
  background-color: var(--color-semantic-background-elevated-alternative);
  border-radius: 12px;
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

const QnABody = styled.div<{ $compact?: boolean; $hasBottomButton?: boolean }>`
  flex: ${({ $compact }) => ($compact ? "0 0 auto" : "1")};
  min-height: ${({ $compact }) => ($compact ? "auto" : "0")};
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${({ $compact, $hasBottomButton }) => {
    if ($compact) return "var(--space-5) var(--space-4)";
    if ($hasBottomButton === false) return "32px 16px";
    return "32px 16px calc(96px + env(safe-area-inset-bottom, 0px))";
  }};
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const IntroQAItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const IntroQAQuestion = styled.p`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  color: var(--color-semantic-label-alternative);
  margin: 0;
`;

const IntroQAAnswer = styled.p`
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  color: var(--color-semantic-label-normal);
  margin: 0;
  line-height: 1.5;
  padding: 0 16px;
`;

const QnADivider = styled.hr<{ $compact?: boolean }>`
  margin: ${({ $compact }) => ($compact ? "var(--space-4) 0" : "24px 0")};
  border: none;
  border-top: 1px dashed var(--color-semantic-line-normal-neutral);
  width: 100%;
`;

const MoreIndicator = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: ${({ $compact }) => ($compact ? "var(--space-3) 0 var(--space-2)" : "24px 0 16px")};
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-semantic-label-assistive);
`;

const MoreText = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  width: 100%;
`;

const RatingSummaryCard = styled.section`
  width: calc(100% - 32px);
  margin: var(--space-4) var(--space-4) 0;
  padding: var(--space-4);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  border-radius: 8px;
`;

const RatingSummaryTitle = styled.h2`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  color: var(--color-semantic-label-alternative);
`;

const RatingScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const RatingStars = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2px);
  margin-right: var(--space-2);
`;

const RatingStarIcon = styled.span`
  font-size: var(--typography-heading-1-font-size);
  line-height: var(--typography-heading-1-line-height);
  color: var(--color-semantic-status-positive);
`;

const RatingScoreText = styled.span`
  font-size: var(--typography-headline-2-font-size);
  font-weight: var(--typography-headline-2-font-weight);
  line-height: var(--typography-headline-2-line-height);
  color: var(--color-semantic-label-neutral);
`;

const RatingCountText = styled.span`
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  color: var(--color-semantic-label-alternative);
`;

const RatingChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const RatingChip = styled.span`
  padding: var(--spacing-6px) var(--space-2);
  border-radius: 8px;
  background-color: var(--color-semantic-line-solid-alternative);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  color: var(--color-semantic-label-neutral);
`;

const RatingMoreChip = styled(RatingChip)`
  font-size: var(--typography-label-2-font-size);
  line-height: var(--typography-label-2-line-height);
  color: var(--color-semantic-label-alternative);
`;
