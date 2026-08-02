"use client";

import styled from "styled-components";

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 스크린리더용 그룹 라벨. */
  label: string;
  className?: string;
}

/**
 * FilterChips — Figma: Category/Category [2240:33591]
 * 정보를 특정 주제나 그룹으로 나누어 구분하고 접근할 때 사용한다.
 * 단일 선택 전용(선택 해제 없음).
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: FilterChipsProps<T>) {
  return (
    <Container className={className} role="tablist" aria-label={label}>
      {options.map((option) => (
        <Chip
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          $selected={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-6px);
  padding: 0 var(--space-5);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--spacing-6px) var(--space-2);
  border-radius: var(--space-2);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  ${({ $selected }) =>
    $selected
      ? `
        border: 1px solid var(--color-semantic-label-strong);
        background-color: var(--color-semantic-label-strong);
        color: var(--color-semantic-inverse-label);
      `
      : `
        border: 1px solid var(--color-semantic-line-normal-neutral);
        background-color: transparent;
        color: var(--color-semantic-label-alternative);
      `}
`;
