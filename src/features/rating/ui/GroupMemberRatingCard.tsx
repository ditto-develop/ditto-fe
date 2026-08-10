"use client";

import styled from "styled-components";
import { Avatar, Checkbox } from "@/shared/ui";
import { GroupStepIndicator } from "@/features/rating/ui/GroupStepIndicator";
import { RatingFormFields } from "@/features/rating/ui/RatingFormFields";
import { toTargetMetadata, toTargetNickname } from "@/features/rating/model/labels";
import type {
  GroupReviewFormValue,
  ReviewFormValue,
  ReviewTarget,
} from "@/features/rating/model/types";

interface GroupMemberRatingCardProps {
  target: ReviewTarget;
  form: GroupReviewFormValue;
  current: number;
  total: number;
  onFormChange: (form: ReviewFormValue) => void;
  onRematchChange: (checked: boolean) => void;
  onHelpClick: () => void;
}

export function GroupMemberRatingCard({
  target,
  form,
  current,
  total,
  onFormChange,
  onRematchChange,
  onHelpClick,
}: GroupMemberRatingCardProps) {
  const nickname = toTargetNickname(target);

  return (
    <Card>
      <MemberHeader>
        <Avatar src={target.profileImageUrl ?? undefined} alt={`${nickname} 프로필`} size="md" />
        <MemberText>
          <Nickname>{nickname}</Nickname>
          <Metadata>{toTargetMetadata(target)}</Metadata>
        </MemberText>
      </MemberHeader>

      <RatingFormFields value={form} onChange={onFormChange} />

      <RematchRow>
        <Checkbox
          checked={form.wantsOneToOneRematch}
          onChange={onRematchChange}
          label={
            <RematchLabel>
              💝 1:1로 다시 만나고 싶어요
              <HelpButton
                type="button"
                aria-label="1:1 재매칭 프로세스 도움말"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onHelpClick();
                }}
              >
                ?
              </HelpButton>
            </RematchLabel>
          }
          helperText="상대방도 나를 선택하면 다음 금요일에 1:1 채팅방이 열려요."
        />
      </RematchRow>

      <GroupStepIndicator current={current} total={total} />
    </Card>
  );
}

const Card = styled.article`
  width: 100%;
  padding: var(--space-6) var(--space-5);
  box-sizing: border-box;
  border-radius: var(--space-2);
  background-color: var(--color-semantic-background-elevated-alternative);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
`;

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
`;

const MemberText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-\[2px\]);
`;

const Nickname = styled.h2`
  margin: 0;
  font-size: var(--typography-headline-2-font-size);
  font-weight: var(--typography-headline-2-font-weight);
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const Metadata = styled.p`
  margin: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const RematchRow = styled.div`
  padding-top: var(--space-1);
`;

const RematchLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-6px);
`;

const HelpButton = styled.button`
  width: var(--space-4);
  height: var(--space-4);
  border: var(--space-\[1px\]) solid var(--color-semantic-line-normal-strong);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--typography-caption-2-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-caption-2-line-height);
  color: var(--color-semantic-label-alternative);
`;
