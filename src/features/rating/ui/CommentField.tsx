"use client";

import styled from "styled-components";

import { containsForbiddenWord } from "@/features/chat";
import { FORBIDDEN_COMMENT_MESSAGE } from "@/features/rating/model/labels";

const MAX_LENGTH = 50;

interface CommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

/**
 * 비속어가 든 코멘트는 제출하지 않는다(2026-10-04 QA). 금칙어 목록은 채팅과 같은 것을 쓴다 —
 * 제출 차단은 `useReviewSubmission` 이 하고, 여기서는 입력하는 동안 미리 알린다.
 */
export function CommentField({ value, onChange, onFocusChange }: CommentFieldProps) {
  const hasForbiddenWord = containsForbiddenWord(value);

  return (
    <Wrapper>
      <Field $invalid={hasForbiddenWord}>
        <TextArea
          value={value}
          maxLength={MAX_LENGTH}
          aria-label="한줄 코멘트"
          aria-invalid={hasForbiddenWord || undefined}
          placeholder="예: 따뜻해요, 재밌어요, 약속 잘 지켜요"
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
        />
        <Counter aria-live="polite">{value.length}/{MAX_LENGTH}</Counter>
      </Field>
      {hasForbiddenWord && <Warning role="status">{FORBIDDEN_COMMENT_MESSAGE}</Warning>}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const Field = styled.div<{ $invalid: boolean }>`
  width: 100%;
  min-height: var(--space-20);
  padding: var(--space-3) var(--space-4);
  box-sizing: border-box;
  border: var(--spacing-1px) solid
    ${({ $invalid }) =>
      $invalid ? "var(--color-semantic-status-negative)" : "var(--color-semantic-line-normal-normal)"};
  border-radius: var(--space-3);
  background-color: var(--color-semantic-background-normal-normal);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &:focus-within {
    border-color: ${({ $invalid }) =>
      $invalid ? "var(--color-semantic-status-negative)" : "var(--color-semantic-line-normal-strong)"};
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

const Warning = styled.span`
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-status-negative);
`;
