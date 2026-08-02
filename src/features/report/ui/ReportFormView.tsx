"use client";

import { useState } from "react";
import styled from "styled-components";

import type { useReportForm } from "@/features/report/hooks/useReportForm";
import { REPORT_REASONS } from "@/features/report/model/reportReasons";
import type { ReportTarget } from "@/features/report/model/types";
import { EvidenceAttachField } from "@/features/report/ui/EvidenceAttachField";
import { ReportDetailField } from "@/features/report/ui/ReportDetailField";
import { ReportReasonCard } from "@/features/report/ui/ReportReasonCard";
import { Avatar, Button, Checkbox, TopNavigation } from "@/shared/ui";

interface ReportFormViewProps {
  target: ReportTarget | null;
  form: ReturnType<typeof useReportForm>;
  onCancel: () => void;
  onSubmit: () => void;
}

/** Figma 7.1 신고/차단 [2441:30585] (빈 상태) / [2448:31174] (입력 상태) */
export function ReportFormView({ target, form, onCancel, onSubmit }: ReportFormViewProps) {
  const [tooltipVisible, setTooltipVisible] = useState(true);

  return (
    <Page>
      <TopNavigation label="신고하기" onBack={onCancel} />

      <Content>
        <Intro>
          <Avatar src={target?.profileImageUrl ?? undefined} size="xl" alt={target?.nickname} />
          <Nickname>{target?.nickname ?? ""}</Nickname>
          <IntroDescription>
            신고 내용은 관리자만 확인 가능하며,
            <br />
            허위 신고 시 이용이 제한될 수 있어요.
          </IntroDescription>
        </Intro>

        <Body>
          <Field>
            <FieldHeading>
              신고 사유 선택
              <Required aria-hidden="true">*</Required>
            </FieldHeading>
            <ReasonList role="radiogroup" aria-label="신고 사유 선택">
              {REPORT_REASONS.map((option) => (
                <ReportReasonCard
                  key={option.value}
                  option={option}
                  selected={form.reason === option.value}
                  onSelect={form.selectReason}
                />
              ))}
            </ReasonList>
          </Field>

          <ReportDetailField
            value={form.detail}
            onChange={form.changeDetail}
            required={form.detailRequired}
          />

          <EvidenceAttachField
            evidence={form.evidence}
            onAdd={form.addEvidence}
            onRemove={form.removeEvidence}
            tooltipVisible={tooltipVisible}
            onDismissTooltip={() => setTooltipVisible(false)}
          />

          <Checkbox
            checked={form.blockTarget}
            onChange={form.setBlockTarget}
            label="이 사용자 차단하기"
            helperText="앞으로 이 사용자와 매칭되지 않습니다"
          />
        </Body>
      </Content>

      <Actions>
        <ActionsInner>
          <Button type="button" $variant="outlined" $size="large" onClick={onCancel}>
            취소
          </Button>
          <Button
            type="button"
            $variant="solid"
            $size="large"
            disabled={!form.canSubmit}
            onClick={onSubmit}
          >
            신고하기
          </Button>
        </ActionsInner>
      </Actions>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Content = styled.main`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-4) var(--space-4) 120px;
  box-sizing: border-box;
`;

const Intro = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: var(--space-9);
`;

const Nickname = styled.h1`
  margin: var(--space-2) 0 0;
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-semantic-label-normal);
  text-align: center;
`;

const IntroDescription = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const Body = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-9);
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const FieldHeading = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const Required = styled.span`
  color: var(--color-semantic-status-negative);
`;

const ReasonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Actions = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--color-semantic-background-elevated-normal);
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
`;

const ActionsInner = styled.div`
  display: flex;
  gap: var(--space-3);
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;

  > button {
    flex: 1 0 0;
    min-width: 0;
  }
`;
