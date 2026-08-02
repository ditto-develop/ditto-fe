"use client";

import styled from "styled-components";
import { Avatar, Checkbox } from "@/shared/ui";
import { GroupStepIndicator } from "@/features/rating/ui/GroupStepIndicator";
import { RatingFormFields } from "@/features/rating/ui/RatingFormFields";
import type { GroupMemberProfile, GroupMemberRating, OneOnOneRatingForm } from "@/features/rating";

interface GroupMemberRatingCardProps {
  member: GroupMemberProfile;
  rating: GroupMemberRating;
  current: number;
  total: number;
  onRatingChange: (form: OneOnOneRatingForm) => void;
  onRematchChange: (checked: boolean) => void;
  onHelpClick: () => void;
}

function formatAge(age?: number): string {
  if (!age) return "나이 미공개";
  const lower = Math.floor(age / 5) * 5;
  return `${lower}~${lower + 4}세`;
}

function formatGender(gender?: string): string {
  if (gender === "FEMALE") return "여성";
  if (gender === "MALE") return "남성";
  return "성별 미공개";
}

function formatLocation(location?: string): string {
  const locations: Record<string, string> = {
    seoul: "서울",
    gyeonggi: "경기",
    incheon: "인천",
  };
  return location ? locations[location.toLowerCase()] ?? location : "지역 미공개";
}

export function GroupMemberRatingCard({
  member,
  rating,
  current,
  total,
  onRatingChange,
  onRematchChange,
  onHelpClick,
}: GroupMemberRatingCardProps) {
  return (
    <Card>
      <MemberHeader>
        <Avatar src={member.avatarUrl} alt={`${member.nickname} 프로필`} size="md" />
        <MemberText>
          <Nickname>{member.nickname}</Nickname>
          <Metadata>
            {formatAge(member.age)} · {formatGender(member.gender)} · {formatLocation(member.location)}
          </Metadata>
        </MemberText>
      </MemberHeader>

      <RatingFormFields value={rating} onChange={onRatingChange} />

      <RematchRow>
        <Checkbox
          checked={rating.wantRematch}
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
          helperText="상대방도 나를 선택하면 즉시 매칭돼요."
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
