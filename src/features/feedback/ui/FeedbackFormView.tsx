"use client";

import type { PointerEvent } from "react";
import { useState } from "react";
import styled from "styled-components";

import type { useFeedbackForm } from "@/features/feedback/hooks/useFeedbackForm";
import { FEEDBACK_IMAGE_MAX_COUNT, FEEDBACK_TYPES } from "@/features/feedback/model/feedbackOptions";
import { FeedbackContentField } from "@/features/feedback/ui/FeedbackContentField";
import { FeedbackTypeCard } from "@/features/feedback/ui/FeedbackTypeCard";
import { Button, ImageAttachField, TopNavigation } from "@/shared/ui";

interface FeedbackFormViewProps {
  form: ReturnType<typeof useFeedbackForm>;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * 의견 보내기 입력 화면. 유형 선택 → 내용(1000자) → 스크린샷 0~3장 → 보내기.
 * Figma 가 없어 신고 화면(7.1)의 구성·컴포넌트를 그대로 따른다.
 * 운영자는 확인만 하고 답하지 않으므로 답을 기다리게 하는 문구를 쓰지 않는다.
 */
export function FeedbackFormView({ form, onCancel, onSubmit }: FeedbackFormViewProps) {
  const [contentFocused, setContentFocused] = useState(false);

  /** 입력창 밖 빈 곳을 누르면 키보드를 내린다. 모바일 웹뷰는 알아서 내려 주지 않는다. */
  const dismissKeyboard = (event: PointerEvent<HTMLDivElement>) => {
    const active = document.activeElement;
    if (!(active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)) return;
    if (event.target instanceof Element && event.target.closest("textarea, input, button, label, a")) {
      return;
    }
    active.blur();
  };

  return (
    <Page onPointerDown={dismissKeyboard}>
      <TopNavigation label="의견 보내기" onBack={onCancel} />

      <Content>
        <Intro>
          앱을 쓰다 불편했던 점이나 바라는 점을 알려 주세요.
          <br />
          보내 주신 의견은 서비스 개선에 참고할게요.
        </Intro>

        <Body>
          <Field>
            <FieldHeading>
              의견 유형
              <Required aria-hidden="true">*</Required>
            </FieldHeading>
            <TypeList role="radiogroup" aria-label="의견 유형">
              {FEEDBACK_TYPES.map((option) => (
                <FeedbackTypeCard
                  key={option.value}
                  option={option}
                  selected={form.type === option.value}
                  onSelect={form.selectType}
                />
              ))}
            </TypeList>
          </Field>

          <FeedbackContentField
            value={form.content}
            onChange={form.changeContent}
            onFocusChange={setContentFocused}
          />

          <ImageAttachField
            label="스크린샷 첨부 (선택)"
            addButtonLabel="스크린샷 첨부"
            thumbnailAlt="첨부한 스크린샷"
            images={form.screenshots}
            maxCount={FEEDBACK_IMAGE_MAX_COUNT}
            onAdd={form.addScreenshots}
            onRemove={form.removeScreenshot}
          />
        </Body>
      </Content>

      {/* 입력 중엔 숨긴다 — fixed 라 키보드 위로 딸려 올라와 입력창을 가린다. */}
      {!contentFocused && (
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
              {form.submitting ? "보내는 중..." : "보내기"}
            </Button>
          </ActionsInner>
        </Actions>
      )}
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
  padding: var(--space-4) var(--space-4) var(--space-30);
  box-sizing: border-box;
`;

const Intro = styled.p`
  margin: 0;
  padding-bottom: var(--space-9);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
  word-break: keep-all;
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

const TypeList = styled.div`
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
