"use client";

import styled from "styled-components";

import { formatSanctionDateTime } from "@/features/sanction/lib/sanctionFormat";
import type { SanctionLevel } from "@/features/sanction/model/types";
import { Button, Icon, SectionMessage } from "@/shared/ui";

export interface SanctionNoticeViewProps {
  level: SanctionLevel;
  /** BE가 내려준 levelDescription. 없으면 level 기본 문구를 쓴다. */
  levelDescription: string;
  reasonDescription: string | null;
  startsAt: string | null;
  endsAt: string | null;
  onConfirm: () => void;
  confirmLabel?: string;
}

const TITLE: Record<SanctionLevel, string> = {
  WARNING: "경고를 받았어요",
  SUSPENSION: "이용이 정지됐어요",
  PERMANENT_BAN: "영구 차단됐어요",
};

const DESCRIPTION: Record<SanctionLevel, string> = {
  WARNING: "커뮤니티 정책 위반이 확인됐어요.\n기간 중에는 퀴즈에 참여할 수 없어요.",
  SUSPENSION: "커뮤니티 정책 위반으로 계정 이용이 제한됐어요.\n아래 기간이 지나면 다시 이용할 수 있어요.",
  PERMANENT_BAN: "커뮤니티 정책 위반으로 계정이 영구 차단됐어요.\n더 이상 ditto를 이용할 수 없어요.",
};

/**
 * 제재 안내 화면.
 * Figma 디자인이 아직 없어 기존 디자인 토큰과 공용 컴포넌트로 임시 구성했다.
 * 디자인이 나오면 이 파일만 교체하면 된다.
 */
export function SanctionNoticeView({
  level,
  levelDescription,
  reasonDescription,
  startsAt,
  endsAt,
  onConfirm,
  confirmLabel = "확인",
}: SanctionNoticeViewProps) {
  const period = buildPeriodText(startsAt, endsAt);

  return (
    <Page>
      <Body>
        <Center>
          <IconCircle>
            <Icon name="status.circleBlock" size={40} />
          </IconCircle>
          <Title>{TITLE[level]}</Title>
          <Description>{DESCRIPTION[level]}</Description>
        </Center>

        <Notice>
          <SectionMessage
            tone="negative"
            title={levelDescription || TITLE[level]}
            description={
              <>
                {reasonDescription && <NoticeRow>사유 · {reasonDescription}</NoticeRow>}
                {period && <NoticeRow>{period}</NoticeRow>}
                <NoticeRow>문의는 고객센터로 접수해 주세요.</NoticeRow>
              </>
            }
          />
        </Notice>
      </Body>

      <Actions>
        <ActionsInner>
          <FullWidthButton type="button" $variant="solid" $size="large" onClick={onConfirm}>
            {confirmLabel}
          </FullWidthButton>
        </ActionsInner>
      </Actions>
    </Page>
  );
}

function buildPeriodText(startsAt: string | null, endsAt: string | null): string {
  const start = formatSanctionDateTime(startsAt);
  const end = formatSanctionDateTime(endsAt);

  if (start && end) return `기간 · ${start} ~ ${end}`;
  if (end) return `해제 예정 · ${end}`;
  if (start) return `시작 · ${start}`;
  return "";
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
  white-space: pre-line;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
  text-align: center;
`;

const Notice = styled.div`
  width: 100%;
  padding-bottom: var(--space-2);
`;

const NoticeRow = styled.span`
  display: block;
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
