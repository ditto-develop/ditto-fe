"use client";

import styled from "styled-components";

interface RatingStarInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function RatingStarInput({ value, onChange, label = "별점" }: RatingStarInputProps) {
  return (
    <StarGroup role="radiogroup" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => {
        const score = index + 1;
        const selected = score <= value;

        return (
          <StarButton
            key={score}
            type="button"
            role="radio"
            aria-label={`${score}점`}
            aria-checked={value === score}
            $selected={selected}
            onClick={() => onChange(score)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                onChange(Math.min(5, score + 1));
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                onChange(Math.max(1, score - 1));
              }
              if (event.key === "Home") {
                event.preventDefault();
                onChange(1);
              }
              if (event.key === "End") {
                event.preventDefault();
                onChange(5);
              }
            }}
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 3.5l3.7 7.5 8.3 1.2-6 5.8 1.4 8.2L16 22.3l-7.4 3.9L10 18l-6-5.8 8.3-1.2L16 3.5z" />
            </svg>
          </StarButton>
        );
      })}
    </StarGroup>
  );
}

const StarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const StarButton = styled.button<{ $selected: boolean }>`
  width: var(--space-8);
  height: var(--space-8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $selected }) =>
    $selected
      ? "var(--color-semantic-status-positive)"
      : "var(--color-semantic-label-alternative)"};

  svg {
    width: 100%;
    height: 100%;
    fill: ${({ $selected }) => ($selected ? "currentColor" : "none")};
    stroke: currentColor;
    stroke-width: var(--space-\[2px\]);
    stroke-linejoin: round;
  }

  &:focus-visible {
    outline: var(--space-\[2px\]) solid var(--color-semantic-line-normal-strong);
    outline-offset: var(--space-\[2px\]);
    border-radius: var(--space-1);
  }
`;
