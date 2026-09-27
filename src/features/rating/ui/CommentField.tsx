"use client";

import styled from "styled-components";

const MAX_LENGTH = 50;

interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

export function CommentField({ value, onChange, onFocusChange }: CommentFieldProps) {
  return (
    <Field>
      <TextArea
        value={value}
        maxLength={MAX_LENGTH}
        aria-label="한줄 코멘트"
        placeholder="예: 따뜻해요, 재밌어요, 약속 잘 지켜요"
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
      />
      <Counter aria-live="polite">{value.length}/{MAX_LENGTH}</Counter>
    </Field>
  );
}

const Field = styled.div`
  width: 100%;
  min-height: var(--space-20);
  padding: var(--space-3) var(--space-4);
  box-sizing: border-box;
  border: var(--spacing-1px) solid var(--color-semantic-line-normal-normal);
  border-radius: var(--space-3);
  background-color: var(--color-semantic-background-normal-normal);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &:focus-within {
    border-color: var(--color-semantic-line-normal-strong);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: var(--space-8);
  padding: 0;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: var(--typography-font-family);
  /* iOS는 16px 미만 입력창에 포커스하면 화면을 확대하고 되돌리지 않는다 — body-1(16px)을 쓴다. */
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-normal);

  &::placeholder {
    color: var(--color-semantic-label-assistive);
  }
`;

const Counter = styled.span`
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
