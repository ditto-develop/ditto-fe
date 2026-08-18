"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { BottomActionArea, Button, TopNavigation } from "@/shared/ui";
import { useToast } from "@/context/ToastContext";
import { useGroupRating } from "@/features/rating/hooks/useGroupRating";
import { useMemberReview } from "@/features/rating/hooks/useMemberReview";
import { GroupMemberRatingCard } from "@/features/rating/ui/GroupMemberRatingCard";
import { RatingSkipModal } from "@/features/rating/ui/RatingSkipModal";
import { RematchHelpBottomSheet } from "@/features/rating/ui/RematchHelpBottomSheet";
import { RematchSuccessModal } from "@/features/rating/ui/RematchSuccessModal";
import { toTargetNickname } from "@/features/rating/model/labels";
import type { MemberReview } from "@/features/rating/model/types";

interface GroupRatingContainerProps {
  roomId: string;
}

export function GroupRatingContainer({ roomId }: GroupRatingContainerProps) {
  const { review, state, reload } = useMemberReview(roomId, "GROUP");

  if (state === "loading") return <StateMessage>불러오는 중...</StateMessage>;
  if (state === "error") return <StateMessage>그룹 평가 정보를 불러오지 못했어요.</StateMessage>;
  if (state === "missing" || !review) return <StateMessage>완료했거나 아직 열리지 않은 평가예요.</StateMessage>;

  return <GroupRatingContent review={review} reload={reload} />;
}

interface GroupRatingContentProps {
  review: MemberReview;
  reload: () => Promise<void>;
}

function GroupRatingContent({ review, reload }: GroupRatingContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [helpOpen, setHelpOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const rating = useGroupRating(review, reload);

  // 마지막 대상까지 확정되면 떠난다. 성사 축하가 떠 있으면 닫힌 뒤에 이동한다.
  useEffect(() => {
    if (completed && !rating.rematch) router.replace("/home");
  }, [completed, rating.rematch, router]);

  if (!rating.currentTarget) return <StateMessage>평가할 그룹 멤버가 없어요.</StateMessage>;

  const nickname = toTargetNickname(rating.currentTarget);

  const handleAction = async () => {
    const result = await rating.submitCurrent();
    if (!result) return;

    if (result.completed) {
      showToast("평가를 제출했어요!", "success");
      setCompleted(true);
      return;
    }

    showToast(`${nickname}님 평가를 제출했어요.`, "success");
  };

  return (
    <Page>
      <TopNavigation onClose={() => setSkipModalOpen(true)} />

      <ScrollArea>
        <PageHeader>
          <Title>그룹 멤버 평가</Title>
          <Subtitle>{review.totalTargetCount}명의 멤버를 평가해 주세요.</Subtitle>
        </PageHeader>

        <GroupMemberRatingCard
          target={rating.currentTarget}
          form={rating.form}
          current={rating.current}
          total={rating.total}
          onFormChange={rating.setFormValue}
          onRematchChange={rating.setWantsOneToOneRematch}
          onHelpClick={() => setHelpOpen(true)}
        />
      </ScrollArea>

      <BottomActionArea>
        <SubmitButton
          type="button"
          $size="large"
          disabled={!rating.canContinue}
          onClick={handleAction}
        >
          {rating.submitting
            ? "제출 중..."
            : rating.isLast
              ? "평가 제출하기"
              : "다음 멤버 평가하기"}
        </SubmitButton>
      </BottomActionArea>

      {helpOpen && <RematchHelpBottomSheet onClose={() => setHelpOpen(false)} />}

      {rating.rematch && (
        <RematchSuccessModal
          nickname={toTargetNickname(
            review.targets.find((target) => target.memberId === rating.rematch?.matchedMemberId) ??
              rating.currentTarget,
          )}
          onClose={rating.clearRematch}
        />
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
  padding: 0 var(--space-4) var(--space-32);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const PageHeader = styled.header`
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
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
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
