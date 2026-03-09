"use client";

import styled from "styled-components";
import { ReactNode } from "react";

interface BottomActionAreaProps {
    children: ReactNode;
    className?: string;
}

/**
 * BottomActionArea — Figma: Action Area/Action Area
 * 고정 하단 CTA 영역. 1버튼(대화 신청하기) 또는 2버튼(거절하기 | 수락하기) 레이아웃.
 * children으로 Button을 전달하여 유연하게 사용.
 */
export default function BottomActionArea({ children, className }: BottomActionAreaProps) {
  console.log('[src/shared/ui/BottomActionArea/BottomActionArea.tsx] BottomActionArea'); // __component_log__
    return (
        <Container className={className}>
            <Inner>{children}</Inner>
        </Container>
    );
}

const Container = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
`;

const Inner = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 393px;
  margin: 0 auto;
`;
