"use client";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { opacity: 0.55; }
  50% { opacity: 1; }
  100% { opacity: 0.55; }
`;

/**
 * 로딩 중 자리를 잡아 두는 회색 블록.
 *
 * 로딩 문구 한 줄만 띄우면 데이터가 도착하는 순간 레이아웃이 통째로 바뀌어 화면이 한 번 튄다.
 * 실제 콘텐츠와 같은 실루엣을 미리 깔아 두면 그 전환이 눈에 띄지 않는다.
 *
 * 실루엣이 어긋나면 오히려 교체가 더 티나므로, 쓰는 쪽에서 실제 컴포넌트의
 * padding/gap/높이 값을 그대로 재사용할 것.
 */
export const SkeletonBlock = styled.div<{
    $width: string;
    $height: string;
    $radius?: string;
    $circle?: boolean;
}>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  border-radius: ${({ $circle, $radius }) => ($circle ? "50%" : ($radius ?? "6px"))};
  background-color: var(--color-semantic-fill-normal);
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
