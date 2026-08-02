"use client";

import styled from "styled-components";
import { MultiSelectChip } from "@/shared/ui";
import type { MetStatus } from "@/features/rating";

const OPTIONS: Array<{ value: MetStatus; label: string }> = [
  { value: "MET", label: "만났어요 😊" },
  { value: "PLANNED", label: "약속 잡았어요 📅" },
  { value: "CHAT_ONLY", label: "채팅만 했어요 💬" },
  { value: "NO_SHOW", label: "노쇼 당했어요 😢" },
];

interface MetStatusSelectProps {
  value: MetStatus | null;
  onChange: (value: MetStatus) => void;
}

export function MetStatusSelect({ value, onChange }: MetStatusSelectProps) {
  return (
    <ChipGrid role="radiogroup" aria-label="오프라인 만남 성사 여부">
      {OPTIONS.map((option) => (
        <MultiSelectChip
          key={option.value}
          option={option}
          size="medium"
          selectedValues={value ? [value] : []}
          sizeConfig={{
            height: "var(--space-10)",
            padding: "var(--space-2) var(--space-3)",
          }}
          onClick={(nextValue) => onChange(nextValue as MetStatus)}
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
