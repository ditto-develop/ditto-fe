"use client";

import styled from "styled-components";

export interface ProfileIntroViewProps {
    avatarUrl: string;
    name: string;
    rating?: number | string;
    metaText: string; // e.g. "30-34세 · 여성 · 서울 · 유통/판매"
    interests: string[];
    introNotes: Array<{ question: string; answer: string }>;
}

export function ProfileIntroView({
    avatarUrl,
    name,
    rating,
    metaText,
    interests,
    introNotes,
}: ProfileIntroViewProps) {
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

            <QnACard>
                <TicketDeco src="/assets/decoration/deco.svg" alt="" />
                <QnABody>
                    {introNotes.slice(0, 3).map((item, i) => (
                        <IntroQAItem key={i}>
                            <IntroQAQuestion>{item.question}</IntroQAQuestion>
                            <IntroQAAnswer>{item.answer}</IntroQAAnswer>
                            <QnADivider />
                        </IntroQAItem>
                    ))}
                    <MoreIndicator>
                        <Dot /><Dot /><Dot />
                    </MoreIndicator>
                    <MoreText>
                        대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요
                    </MoreText>
                </QnABody>
            </QnACard>
        </>
    );
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

export const QnACard = styled.div`
  flex: 1;
  min-height: 0;
  width: calc(100% - 32px);
  margin: 32px 16px 0;
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

export const QnABody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px 16px calc(96px + env(safe-area-inset-bottom, 0px));
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

const QnADivider = styled.hr`
  margin: 24px 0;
  border: none;
  border-top: 1px dashed var(--color-semantic-line-normal-neutral);
  width: 100%;
`;

const MoreIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 0 16px;
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
