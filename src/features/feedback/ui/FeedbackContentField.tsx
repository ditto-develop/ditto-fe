"use client";

import styled from "styled-components";

import { FEEDBACK_CONTENT_MAX_LENGTH } from "@/features/feedback/model/feedbackOptions";

interface FeedbackContentFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** 입력 중에는 하단 CTA 를 숨긴다 — 키보드 위로 딸려 올라와 입력창을 가린다. */
  onFocusChange?: (focused: boolean) => void;
}

/** 의견 내용(필수). 최대 1000자, 하단 카운터. 신고 상세 설명(ReportDetailField)과 같은 모양이다. */
export function FeedbackContentField({ value, onChange, onFocusChange }: FeedbackContentFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor="feedback-content">
        내용
        <Required aria-hidden="true">*</Required>
      </FieldLabel>
      <InputBox>
        <TextArea
          id="feedback-content"
          value={value}
          maxLength={FEEDBACK_CONTENT_MAX_LENGTH}
          placeholder="어떤 화면에서 무엇을 하다가 생긴 일인지 적어 주시면 큰 도움이 돼요."
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
        />
        <Counter>
          {value.length}/{FEEDBACK_CONTENT_MAX_LENGTH}
        </Counter>
      </InputBox>
    </Field>
  );
}

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

const Required = styled.span`
  margin-left: var(--space-1);
  color: var(--color-semantic-status-negative);
`;

/* 글자 폭만 차지한다. 한 줄을 다 채우면 옆 빈 곳을 눌러도 입력창에 포커스가 가 키보드가 안 내려간다. */
const FieldLabel = styled.label`
  display: flex;
  align-self: flex-start;
  align-items: center;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const InputBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--space-3);
  box-sizing: border-box;
  background-color: var(--color-semantic-fill-alternative);
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: var(--space-40);
  padding: 0 var(--space-1);
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;
  background: transparent;
  font-family: inherit;
  font-size: var(--typography-body-1-reading-font-size);
  font-weight: var(--typography-body-1-reading-font-weight);
  line-height: var(--typography-body-1-reading-line-height);
  letter-spacing: var(--typography-body-1-reading-letter-spacing);
  color: var(--color-semantic-label-normal);

  &::placeholder {
    color: var(--color-semantic-label-assistive);
  }
`;

const Counter = styled.span`
  align-self: flex-start;
  padding: 0 var(--space-1);
  opacity: var(--color-atomic-opacity-74);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
