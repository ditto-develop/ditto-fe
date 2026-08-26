"use client";

import React from "react";
import styled from "styled-components";

interface TopNavigationProps {
    onBack?: () => void;
    onClose?: () => void;
    label?: string;
    className?: string;
    trailingElement?: React.ReactNode;
    titleAlign?: "center" | "left";
}

/**
 * TopNavigation — Figma: Top Navigation/Top Navigation
 * 모바일 앱 상단 네비게이션 바.
 * back(←) 또는 close(×) 아이콘, 중앙 라벨을 선택적으로 사용.
 */
export function TopNavigation({
    onBack,
    onClose,
    label,
    className,
    trailingElement,
    titleAlign = "center",
}: TopNavigationProps) {
    return (
        <NavContainer className={className}>
            <IconBox onClick={onBack} $isVisible={!!onBack}>
                <IconImg src="/icons/navigation/arrow-left.svg" alt="back" />
            </IconBox>

            {label && <NavLabel $align={titleAlign}>{label}</NavLabel>}

            {trailingElement ? (
                <TrailingBox>{trailingElement}</TrailingBox>
            ) : (
                <IconBox onClick={onClose} $isVisible={!!onClose}>
                    <IconImg src="/icons/navigation/close.svg" alt="close" />
                </IconBox>
            )}
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
  /**
   * 앱(네이티브 셸)에서는 웹뷰가 상태바 아래로 깔려 있어 그대로 두면 제목이 잘린다.
   * 인셋만큼 바를 키우고 같은 값으로 위를 비워, 콘텐츠 영역은 56px을 유지한다.
   * 웹에서는 env()가 0이라 기존과 완전히 동일하다.
   */
  height: calc(56px + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) 16px 0;
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

/* 아이콘 버튼(24px)뿐 아니라 '모두 읽음' 같은 텍스트 버튼도 들어오므로 폭은 최소값만 잡는다. */
const TrailingBox = styled.div`
  min-width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const NavLabel = styled.div<{ $align: NonNullable<TopNavigationProps["titleAlign"]> }>`
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 700;
  color: var(--color-semantic-label-strong);
  text-align: ${({ $align }) => $align};
  padding-left: ${({ $align }) => ($align === "left" ? "var(--space-2)" : "0")};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
