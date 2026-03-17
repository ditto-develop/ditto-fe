"use client";

import styled from "styled-components";

interface TopNavigationProps {
    onBack?: () => void;
    onClose?: () => void;
    label?: string;
    className?: string;
}

/**
 * TopNavigation — Figma: Top Navigation/Top Navigation
 * 모바일 앱 상단 네비게이션 바.
 * back(←) 또는 close(×) 아이콘, 중앙 라벨을 선택적으로 사용.
 */
export default function TopNavigation({ onBack, onClose, label, className }: TopNavigationProps) {
  console.log('[src/shared/ui/TopNavigation/TopNavigation.tsx] TopNavigation'); // __component_log__
    return (
        <NavContainer className={className}>
            <IconBox onClick={onBack} $isVisible={!!onBack}>
                <IconImg src="/icons/navigation/arrow-left.svg" alt="back" />
            </IconBox>

            {label && <NavLabel>{label}</NavLabel>}

            <IconBox onClick={onClose} $isVisible={!!onClose}>
                <IconImg src="/icons/navigation/close.svg" alt="close" />
            </IconBox>
        </NavContainer>
    );
}

const NavContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 56px;
  padding: 0 16px;
  box-sizing: border-box;
  background-color: var(--color-semantic-background-normal-normal);
`;

const IconBox = styled.div<{ $isVisible: boolean }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $isVisible }) => ($isVisible ? "pointer" : "default")};
  visibility: ${({ $isVisible }) => ($isVisible ? "visible" : "hidden")};
`;

const IconImg = styled.img`
  width: 100%;
  height: 100%;
  display: block;
`;

const NavLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-semantic-label-strong, #1A1A1A);
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
