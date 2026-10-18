"use client";

import styled from "styled-components";

import { Button, Icon } from "@/shared/ui";

interface LaunchNotificationCompleteViewProps {
  onConfirm: () => void;
}

/** Android 출시 알림 신청 완료. 의견 보내기 완료와 같은 구성이다. */
export function LaunchNotificationCompleteView({ onConfirm }: LaunchNotificationCompleteViewProps) {
  return (
    <Page>
      <Body>
        <Center>
          <IconCircle>
            <Icon name="status.circleCheckFill" size={40} />
          </IconCircle>
          <Title>알림 신청이 끝났어요</Title>
          <Description>
            Android 앱이 나오면 메일로 알려 드릴게요.
            <br />
            신청한 이메일은 3개월 뒤 지워져요.
          </Description>
        </Center>
      </Body>

      <Actions>
        <ActionsInner>
          <FullWidthButton type="button" $variant="solid" $size="large" onClick={onConfirm}>
            확인
          </FullWidthButton>
        </ActionsInner>
      </Actions>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Body = styled.main`
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-4);
  box-sizing: border-box;
`;

const Center = styled.section`
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: 0 var(--space-4);
`;

const IconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-18);
  height: var(--space-18);
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--color-semantic-fill-normal);
  color: var(--color-semantic-primary-normal);
`;

const Title = styled.h1`
  margin: var(--space-3) 0 0;
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-semantic-label-normal);
  text-align: center;
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
  text-align: center;
`;

const Actions = styled.div`
  position: sticky;
  bottom: 0;
  background-color: var(--color-semantic-background-elevated-normal);
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
`;

const ActionsInner = styled.div`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;
