"use client";

import { Fragment, type ReactNode } from "react";
import styled from "styled-components";

type RecordQuestionSectionProps = {
  /** "내가 고른 답 12" / "질문별 선택" */
  heading: string;
  /** 문항 하나씩. 사이마다 점선 구분선이 들어간다. */
  items: Array<{ key: string | number; node: ReactNode }>;
};

/**
 * 문항 목록 카드 — 제목 아래 카드 하나에 문항을 점선으로 나눠 쌓는다
 * (Figma 내 답변 3254:37988 · 퀴즈 결과 3255:37130).
 */
export function RecordQuestionSection({ heading, items }: RecordQuestionSectionProps) {
  return (
    <Section>
      <Heading>{heading}</Heading>
      <Card>
        {items.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 && <DashedDivider aria-hidden />}
            {item.node}
          </Fragment>
        ))}
      </Card>
    </Section>
  );
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-3) + var(--spacing-2px));
  width: 100%;
  padding-top: var(--spacing-6px);
`;

const Heading = styled.h2`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-4);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
`;

/* 시안의 구분선은 2px 선·4px 틈의 점선이다(3255:36472). border dashed 는 브라우저마다 간격이 달라
   그라디언트로 그린다. */
const DashedDivider = styled.hr`
  width: 100%;
  height: 1px;
  margin: 0;
  border: none;
  background-image: linear-gradient(
    to right,
    var(--color-semantic-line-solid-normal) 2px,
    transparent 2px
  );
  background-size: 6px 1px;
  background-repeat: repeat-x;
`;
