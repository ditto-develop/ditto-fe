"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

type NotebookCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 8.1 기록의 수첩 카드 — 윗변에 스프링 구멍 장식("Deco", Figma 3254:37087)이 걸린 카드.
 * 기록 탭 이번 주 카드·내 답변/퀴즈 결과 머리 카드·대화방 "우리의 답변" 머리 카드가 같이 쓴다.
 *
 * 장식은 마스크로 그려 색을 토큰(line/solid/neutral)으로 받는다. 원본 SVG 는 315×14 이고
 * 카드 폭에 맞춰 늘리지 않는다(구멍 간격이 시안과 달라진다).
 */
export function NotebookCard({ children, className }: NotebookCardProps) {
  return (
    <Card className={className}>
      <Deco aria-hidden />
      {children}
    </Card>
  );
}

const Card = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
`;

const Deco = styled.span`
  position: absolute;
  top: -7px;
  left: 50%;
  width: 315px;
  max-width: calc(100% - 32px);
  height: 14px;
  transform: translateX(-50%);
  background-color: var(--color-semantic-line-solid-neutral);
  -webkit-mask: url("/images/records/card-deco.svg") no-repeat left center / 315px 14px;
  mask: url("/images/records/card-deco.svg") no-repeat left center / 315px 14px;
  pointer-events: none;
`;
