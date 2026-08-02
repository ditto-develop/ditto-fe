"use client";

import styled from "styled-components";

import type { ReportResult } from "@/features/report/model/types";
import { Button, Icon, SectionMessage } from "@/shared/ui";

interface ReportCompleteViewProps {
  result: ReportResult;
  onConfirm: () => void;
}

/** Figma 7.1.1 신고 완료 [2456:32156] */
export function ReportCompleteView({ result, onConfirm }: ReportCompleteViewProps) {
  return (
    <Page>
      <Body>
        <Center>
          <IconCircle>
            <Icon name="status.circleBlock" size={40} />
          </IconCircle>
          <Title>신고가 접수됐어요</Title>
          <Description>
            신고 내용을 검토 후 조치하겠습니다.
            <br />
            처리 결과는 알림으로 안내드릴게요.
          </Description>
        </Center>

        {result.blockRequested && (
          <BlockNotice>
            <SectionMessage
              tone="negative"
              title="차단이 적용됐어요"
              description={`${result.targetNickname}님은 매칭 및 채팅에서 제외되며, 차단 해제는 설정 > 차단 목록에서 가능해요.`}
            />
          </BlockNotice>
        )}
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
  color: var(--color-semantic-label-assistive);
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

const BlockNotice = styled.div`
  width: 100%;
  padding-bottom: var(--space-2);
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
