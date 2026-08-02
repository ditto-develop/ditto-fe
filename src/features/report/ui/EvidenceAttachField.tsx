"use client";

import { useRef } from "react";
import styled from "styled-components";

import { REPORT_EVIDENCE_MAX_COUNT } from "@/features/report/model/reportReasons";
import type { ReportEvidence } from "@/features/report/model/types";
import { Icon, Tooltip } from "@/shared/ui";

interface EvidenceAttachFieldProps {
  evidence: ReportEvidence[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  /** 첨부가 하나도 없을 때만 노출되는 안내 툴팁. */
  tooltipVisible: boolean;
  onDismissTooltip: () => void;
}

/** Figma 7.1 [2444:30837] — 증거 첨부(선택). 최대 3장, 장당 5MB. */
export function EvidenceAttachField({
  evidence,
  onAdd,
  onRemove,
  tooltipVisible,
  onDismissTooltip,
}: EvidenceAttachFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = evidence.length >= REPORT_EVIDENCE_MAX_COUNT;

  return (
    <Field>
      <FieldLabel>증거 첨부 (선택)</FieldLabel>
      <Row>
        <AddButton
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={full}
          aria-label="증거 이미지 첨부"
        >
          <CameraIcon name="action.camera" size={32} />
          <Counter>
            {evidence.length}/{REPORT_EVIDENCE_MAX_COUNT}
          </Counter>
        </AddButton>

        <HiddenFileInput
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            if (event.target.files) onAdd(event.target.files);
            // 같은 파일을 연속으로 고를 수 있도록 값을 비운다.
            event.target.value = "";
          }}
        />

        {evidence.map((item) => (
          <Thumbnail key={item.id}>
            <ThumbnailImage src={item.previewUrl} alt="첨부한 증거" />
            <RemoveButton
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="첨부 삭제"
            >
              <Icon name="navigation.close" size={12} />
            </RemoveButton>
          </Thumbnail>
        ))}

        {tooltipVisible && evidence.length === 0 && (
          <Tooltip message="스크린샷을 첨부해 주세요." onClose={onDismissTooltip} />
        )}
      </Row>
    </Field>
  );
}

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

const FieldLabel = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
`;

const AddButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--spacing-6px);
  background-color: var(--color-semantic-fill-alternative);
  color: var(--color-semantic-label-assistive);
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: var(--color-atomic-opacity-52);
  }
`;

/* Figma의 카메라 아이콘은 fill/strong(=neutral 50 @16%)으로, 카운터 텍스트보다 옅다. */
const CameraIcon = styled(Icon)`
  color: var(--color-semantic-fill-strong);
`;

const Counter = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-assistive);
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const Thumbnail = styled.div`
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: var(--spacing-6px);
  overflow: hidden;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-5);
  height: var(--space-5);
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background-color: var(--color-semantic-inverse-background);
  color: var(--color-semantic-inverse-label);
`;
