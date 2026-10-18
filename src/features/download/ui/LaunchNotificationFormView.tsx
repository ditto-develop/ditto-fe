"use client";

import styled from "styled-components";

import type { useLaunchNotificationForm } from "@/features/download/hooks/useLaunchNotificationForm";
import { LAUNCH_NOTIFICATION_CONSENT } from "@/features/download/model/launchNotification";
import { Button, Checkbox, TextField, TopNavigation } from "@/shared/ui";

interface LaunchNotificationFormViewProps {
  form: ReturnType<typeof useLaunchNotificationForm>;
  onBack: () => void;
  onOpenPrivacyPolicy: () => void;
  onSubmit: () => void;
}

/**
 * Android 출시 알림 신청. 이메일 하나와 개인정보 수집·이용 동의(필수)만 받는다.
 * 동의 문구에는 법이 요구하는 네 가지(항목·목적·보유 기간·거부할 권리)를 모두 보여 준다.
 */
export function LaunchNotificationFormView({
  form,
  onBack,
  onOpenPrivacyPolicy,
  onSubmit,
}: LaunchNotificationFormViewProps) {
  return (
    <Page>
      <TopNavigation onBack={onBack} />

      <Content>
        <Head>
          <Title>Android 출시 알림 받기</Title>
          <Description>Android 앱이 나오면 메일로 가장 먼저 알려 드릴게요.</Description>
        </Head>

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <TextField
            id="launch-notification-email"
            label="이메일"
            isessential
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={(event) => form.changeEmail(event.target.value)}
            onBlur={form.touchEmail}
            status={form.emailInvalid ? "error" : "default"}
            errmessage={form.emailInvalid ? ["이메일 형식이 올바르지 않아요."] : undefined}
          />

          <ConsentBox>
            <Checkbox
              checked={form.consented}
              onChange={form.setConsented}
              label="[필수] 개인정보 수집·이용에 동의합니다"
            />
            <ConsentTable>
              <ConsentTerm>수집 항목</ConsentTerm>
              <ConsentValue>{LAUNCH_NOTIFICATION_CONSENT.items}</ConsentValue>
              <ConsentTerm>이용 목적</ConsentTerm>
              <ConsentValue>{LAUNCH_NOTIFICATION_CONSENT.purpose}</ConsentValue>
              <ConsentTerm>보유 기간</ConsentTerm>
              <ConsentValue>{LAUNCH_NOTIFICATION_CONSENT.retention}</ConsentValue>
            </ConsentTable>
            <ConsentNote>{LAUNCH_NOTIFICATION_CONSENT.refusal}</ConsentNote>
            <PolicyLink type="button" onClick={onOpenPrivacyPolicy}>
              개인정보처리방침 전문 보기
            </PolicyLink>
          </ConsentBox>

          <SubmitButton type="submit" $variant="solid" $size="large" disabled={!form.canSubmit}>
            {form.submitting ? "신청하는 중..." : "알림 신청하기"}
          </SubmitButton>
        </Form>
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Content = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-2) var(--space-4) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
`;

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
  word-break: keep-all;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const ConsentBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--space-3);
  background-color: var(--color-semantic-background-normal-alternative);
`;

const ConsentTable = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: var(--space-3);
  row-gap: var(--space-1);
  margin: 0;
`;

const ConsentTerm = styled.dt`
  font-size: var(--typography-caption-1-font-size);
  font-weight: 600;
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const ConsentValue = styled.dd`
  margin: 0;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-neutral);
  word-break: keep-all;
`;

const ConsentNote = styled.p`
  margin: 0;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-alternative);
  word-break: keep-all;
`;

const PolicyLink = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--typography-caption-1-font-size);
  font-weight: 600;
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-neutral);
  text-decoration: underline;
`;

const SubmitButton = styled(Button)`
  width: 100%;
`;
