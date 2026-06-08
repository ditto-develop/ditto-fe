"use client";

import styled from "styled-components";
import type { MyRatingSummary } from "@/features/profile/model/types";

interface ReceivedRatingsCardProps {
    ratingSummary: MyRatingSummary | null;
}

export function ReceivedRatingsCard({ ratingSummary }: ReceivedRatingsCardProps) {
    const totalCount = ratingSummary?.totalCount ?? 0;
    const threshold = ratingSummary?.publicThreshold ?? 3;
    const isPublic = Boolean(ratingSummary && totalCount >= threshold);
    const publicRatingSummary = isPublic ? ratingSummary : null;
    const filledCount = publicRatingSummary ? Math.round(publicRatingSummary.averageScore) : 0;
    const comments = publicRatingSummary
        ? [...(publicRatingSummary.ratings ?? [])]
            .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
            .map((item) => item.comment?.trim())
            .filter((comment): comment is string => Boolean(comment))
            .slice(0, 3)
        : [];
    const moreCount = publicRatingSummary ? Math.max(totalCount - 3, 0) : 0;

    return (
        <Card>
            <Heading>받은 평가</Heading>
            {publicRatingSummary ? (
                <Content>
                    <ScoreRow>
                        <StarRating filledCount={filledCount} />
                        <ScoreText>{publicRatingSummary.averageScore.toFixed(1)}</ScoreText>
                        <CountText>({totalCount})</CountText>
                    </ScoreRow>
                    <ChipRow aria-label="받은 평가 코멘트">
                        {publicRatingSummary.noShowCount > 0 && (
                            <NoShowChip>⚠ 노쇼 {publicRatingSummary.noShowCount}회</NoShowChip>
                        )}
                        {comments.map((comment) => (
                            <RatingChip key={comment}>{comment}</RatingChip>
                        ))}
                        {moreCount > 0 && <MoreChip>+{moreCount}</MoreChip>}
                    </ChipRow>
                </Content>
            ) : (
                <EmptyContent>
                    <StarRating filledCount={0} />
                    <EmptyTitle>평가가 충분하지 않아요</EmptyTitle>
                    <EmptyDescription>3개 이상의 평가가 등록되면 여기에 표시돼요.</EmptyDescription>
                </EmptyContent>
            )}
        </Card>
    );
}

function StarRating({ filledCount }: { filledCount: number }) {
    return (
        <Stars aria-label={`별점 ${filledCount}점`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} $filled={index < filledCount}>★</Star>
            ))}
        </Stars>
    );
}

const Card = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-4) var(--space-4) var(--space-5);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Heading = styled.h2`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const Stars = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2px);
  margin-right: var(--space-2);
`;

const Star = styled.span<{ $filled: boolean }>`
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  color: ${({ $filled }) =>
    $filled
      ? "var(--color-semantic-status-positive)"
      : "var(--color-semantic-background-normal-normal)"};
`;

const ScoreText = styled.span`
  font-size: var(--typography-headline-2-font-size);
  font-weight: var(--typography-headline-2-font-weight);
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const CountText = styled.span`
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const RatingChip = styled.span`
  padding: var(--spacing-6px) var(--space-2);
  border-radius: var(--space-2);
  background-color: var(--color-semantic-line-solid-alternative);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const MoreChip = styled(RatingChip)`
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const NoShowChip = styled(RatingChip)`
  background-color: var(--color-atomic-brickRed-99);
  color: var(--color-semantic-status-negative);
`;

const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) 0 var(--space-2);
  text-align: center;
`;

const EmptyTitle = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-normal);
`;
