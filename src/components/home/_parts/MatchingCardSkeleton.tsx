"use client";

import styled from "styled-components";

import { CardContainer, DecoImg } from "@/components/display/Card";
import { SkeletonBlock } from "@/shared/ui";

/**
 * 홈 하단 카드 자리를 미리 잡아두는 스켈레톤.
 *
 * 데이터가 오기 전에는 타임라인만 렌더돼서, 카드가 뒤늦게 붙을 때 레이아웃이
 * 한 번 밀리며 "따로 튀어나오는" 느낌을 준다.
 * 실루엣이 어긋나면 교체가 티나므로 실제 카드와 같은 shell(CardContainer + 톱니 deco)을 쓰고,
 * 높이도 실제 카드(제목 28 + 8 + 설명 40, 박스 102, 버튼 52 — 매칭 카드 기준 342px)와 같게 잡는다.
 * 스켈레톤이 실제 카드보다 크면 로딩 중에만 홈에 스크롤이 생긴다.
 */
export function MatchingCardSkeleton() {
  return (
    <CardContainer aria-hidden="true" data-cy="home-card-skeleton">
      <DecoImg src="/display/deco.svg" alt="" />
      <TitleGroup>
        <Header>
          <SkeletonBlock $width="96px" $height="28px" />
          <SkeletonBlock $width="64px" $height="28px" $radius="6px" />
        </Header>
        <Lines>
          <SkeletonBlock $width="100%" $height="16px" />
          <SkeletonBlock $width="72%" $height="16px" />
        </Lines>
      </TitleGroup>
      <SkeletonBlock $width="100%" $height="102px" $radius="12px" />
      <SkeletonBlock $width="100%" $height="52px" $radius="12px" />
    </CardContainer>
  );
}

/* 실제 카드의 제목·설명 묶음(TitleGroup, gap 8px)과 같은 간격. */
const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Lines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
