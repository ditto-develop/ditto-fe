"use client";

import styled from "styled-components";
import { RatingStarInput } from "@/shared/ui";
import { CommentField } from "@/features/rating/ui/CommentField";
import { MetStatusSelect } from "@/features/rating/ui/MetStatusSelect";
import type { OneOnOneRatingForm } from "@/features/rating";

interface RatingFormFieldsProps {
  value: OneOnOneRatingForm;
  onChange: (value: OneOnOneRatingForm) => void;
}

export function RatingFormFields({ value, onChange }: RatingFormFieldsProps) {
  return (
    <Fields>
      <FieldSection>
        <FieldTitle>1. 오프라인 만남 성사 여부 <Required>*</Required></FieldTitle>
        <MetStatusSelect
          value={value.metStatus}
          onChange={(metStatus) => onChange({ ...value, metStatus })}
        />
      </FieldSection>

      <FieldSection>
        <FieldTitle>2. 별점 평가 <Required>*</Required></FieldTitle>
        <StarCenter>
          <RatingStarInput
            value={value.stars}
            onChange={(stars) => onChange({ ...value, stars })}
          />
        </StarCenter>
      </FieldSection>

      <FieldSection>
        <FieldTitle>3. 한줄 코멘트</FieldTitle>
        <CommentField
          value={value.comment}
          onChange={(comment) => onChange({ ...value, comment })}
        />
      </FieldSection>
    </Fields>
  );
}

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
`;

const FieldSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const FieldTitle = styled.h2`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Required = styled.span`
  color: var(--color-semantic-status-negative);
`;

const StarCenter = styled.div`
  display: flex;
  justify-content: center;
`;
