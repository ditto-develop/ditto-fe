"use client";

import styled from "styled-components";

import { REPORT_DETAIL_MAX_LENGTH } from "@/features/report/model/reportReasons";

interface ReportDetailFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** reason=etc면 BE가 detail을 필수로 본다(code 6003). 라벨을 (필수)로 바꾼다. */
  required?: boolean;
}

/** Figma 7.1 [2444:30905] — 상세 설명 (선택). 최대 500자, 하단 우측 카운터. */
export function ReportDetailField({ value, onChange, required = false }: ReportDetailFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor="report-detail">
        상세 설명 ({required ? "필수" : "선택"})
        {required && <Required aria-hidden="true">*</Required>}
      </FieldLabel>
      <InputBox>
        <TextArea
          id="report-detail"
          value={value}
          maxLength={REPORT_DETAIL_MAX_LENGTH}
          placeholder="신고 내용을 자세히 작성해 주시면 빠른 처리에 도움이 됩니다."
          onChange={(event) => onChange(event.target.value)}
        />
        <Counter>
          {value.length}/{REPORT_DETAIL_MAX_LENGTH}
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

const FieldLabel = styled.label`
  display: flex;
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
  min-height: 96px;
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
