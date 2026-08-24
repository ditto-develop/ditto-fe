"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Avatar, BottomActionArea, Button, Checkbox, TopNavigation } from "@/shared/ui";
import { useToast } from "@/context/ToastContext";
import { useMemberReview } from "@/features/rating/hooks/useMemberReview";
import { useOneOnOneRating } from "@/features/rating/hooks/useOneOnOneRating";
import { RatingFormFields } from "@/features/rating/ui/RatingFormFields";
import { RatingSkipModal } from "@/features/rating/ui/RatingSkipModal";
import { RematchSuccessModal } from "@/features/rating/ui/RematchSuccessModal";
import { toTargetNickname } from "@/features/rating/model/labels";
import type { MemberReview } from "@/features/rating/model/types";

interface OneOnOneRatingContainerProps {
  roomId: string;
}

export function OneOnOneRatingContainer({ roomId }: OneOnOneRatingContainerProps) {
  const { review, state, reload } = useMemberReview(roomId, "PERSONAL");

  if (state === "loading") return <StateMessage>불러오는 중...</StateMessage>;
  if (state === "error") return <StateMessage>평가 정보를 불러오지 못했어요.</StateMessage>;
  // 목록에는 미완료 평가만 담긴다. 없으면 이미 제출했거나 아직 열리지 않은 평가다.
  if (state === "missing" || !review) return <StateMessage>완료했거나 아직 열리지 않은 평가예요.</StateMessage>;

  return <OneOnOneRatingContent review={review} reload={reload} />;
}

interface OneOnOneRatingContentProps {
  review: MemberReview;
  reload: () => Promise<void>;
}

function OneOnOneRatingContent({ review, reload }: OneOnOneRatingContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [completed, setCompleted] = useState(false);
  const [shouldReport, setShouldReport] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const rating = useOneOnOneRating(review, reload);

  // 성사 축하가 떠 있으면 닫힌 뒤에 이동한다(1:1 rematch는 계약상 항상 null이다).
  useEffect(() => {
    if (!completed || rating.rematch || !rating.target) return;

    router.replace(
      shouldReport
        ? `/report?userId=${rating.target.memberId}&source=chat-room`
        : "/home",
    );
  }, [completed, rating.rematch, rating.target, router, shouldReport]);

  if (!rating.target) return <StateMessage>평가할 사용자를 찾을 수 없어요.</StateMessage>;

  const nickname = toTargetNickname(rating.target);

  const handleSubmit = async () => {
    const result = await rating.submit();
    if (!result) return;
    showToast("평가를 제출했어요!", "success");
    setCompleted(true);
  };

  return (
    <Page>
      <TopNavigation onClose={() => setSkipModalOpen(true)} />

      <ScrollArea>
        <ProfileHeader>
          <Avatar
            src={rating.target.profileImageUrl ?? undefined}
            alt={`${nickname} 프로필`}
            size="xl"
          />
          <HeaderText>
            <Title>{nickname}님 평가</Title>
            <Subtitle>솔직한 피드백이 더 나은 매칭을 만듭니다</Subtitle>
          </HeaderText>
        </ProfileHeader>

        <RatingFormFields value={rating.form} onChange={rating.setForm} />
        <Checkbox
          checked={shouldReport}
          onChange={setShouldReport}
          label="사용자 신고하기"
          helperText="불쾌하거나 부적절한 행동이 있었나요?"
        />
      </ScrollArea>

      <BottomActionArea>
        <SubmitButton
          type="button"
          $size="large"
          disabled={!rating.canSubmit}
          onClick={handleSubmit}
        >
          {rating.submitting ? "제출 중..." : "평가 제출하기"}
        </SubmitButton>
      </BottomActionArea>

      {rating.rematch && (
        <RematchSuccessModal nickname={nickname} onClose={rating.clearRematch} />
      )}

      <RatingSkipModal
        isOpen={skipModalOpen}
        onClose={() => setSkipModalOpen(false)}
        onConfirm={() => router.replace("/chat")}
      />
    </Page>
  );
}

const Page = styled.main`
  width: 100%;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const ScrollArea = styled.div`
  width: 100%;
  padding: 0 var(--space-5) var(--space-32);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-9);
`;

const ProfileHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--typography-heading-1-font-size);
  font-weight: var(--typography-heading-1-font-weight);
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const SubmitButton = styled(Button)`
  width: 100%;
`;

const StateMessage = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
