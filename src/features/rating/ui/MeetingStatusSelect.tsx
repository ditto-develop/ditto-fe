"use client";

import styled from "styled-components";
import { MultiSelectChip } from "@/shared/ui";
import { MEETING_STATUS_OPTIONS } from "@/features/rating/model/labels";
import type { MeetingStatus } from "@/features/rating/model/types";

interface MeetingStatusSelectProps {
  value: MeetingStatus | null;
  onChange: (value: MeetingStatus) => void;
}

export function MeetingStatusSelect({ value, onChange }: MeetingStatusSelectProps) {
  return (
    <ChipGrid role="radiogroup" aria-label="오프라인 만남 성사 여부">
      {MEETING_STATUS_OPTIONS.map((option) => (
        <MultiSelectChip
          key={option.value}
          option={option}
          size="medium"
          selectedValues={value ? [value] : []}
          sizeConfig={{
            height: "var(--space-10)",
            padding: "var(--space-2) var(--space-3)",
          }}
          onClick={(nextValue) => onChange(nextValue as MeetingStatus)}
        />
      ))}
    </ChipGrid>
  );
}

const ChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;
