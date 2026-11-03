"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

type RecordCardHeadingProps = {
  /** "4주차 · 1:1 · 10월 26일 주" */
  meta: string;
  title: string;
  /** "제출 완료 · 12개 답변" / "10월 27일 21:14 제출" */
  subtitle: string | null;
  /** 오른쪽 위 상태 칩. */
  chip: ReactNode;
};

/**
 * 수첩 카드 윗부분 — 메타 줄·제목·부제와 오른쪽 위 칩(Figma 3254:37068 · 3254:37957 · 3255:37091).
 * 기록 탭의 이번 주 카드와 내 답변/퀴즈 결과 머리 카드가 같은 배치다.
 *
 * 칩은 시안처럼 메타 줄과 같은 높이에 절대 위치로 둔다. 플렉스 한 줄로 묶으면 칩(24px)이
 * 메타 줄(20px)보다 높아 제목이 4px 내려간다.
 */
export function RecordCardHeading({ meta, title, subtitle, chip }: RecordCardHeadingProps) {
  return (
    <Root>
      <Meta>{meta}</Meta>
      <TitleGroup>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TitleGroup>
      <ChipSlot>{chip}</ChipSlot>
    </Root>
  );
}

const Root = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

/* 칩 폭(최대 "결과 공개 전" 76px)만큼 비워 긴 메타 줄이 칩 밑으로 들어가지 않게 한다. */
const Meta = styled.p`
  margin: 0;
  padding-right: 84px;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--typography-heading-2-font-size);
  font-weight: var(--typography-heading-2-font-weight);
  line-height: var(--typography-heading-2-line-height);
  letter-spacing: var(--typography-heading-2-letter-spacing);
  color: var(--color-semantic-label-normal);
  word-break: keep-all;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const ChipSlot = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
`;
