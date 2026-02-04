"use client";

import React, { ReactNode } from "react";
import styled, { css } from "styled-components";

// --- Types ---
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "disabled";
  flex?: number;
  fullWidth?: boolean;
  icon?: ReactNode;
}

// ✅ layout prop 추가 (row: 가로 한 줄, column: 세로 적재)
interface ActionSheetProps {
  children: React.ReactNode;
  sticky?: boolean;
  divider?: boolean;
  caption?: string;
  safeArea?: boolean;
  layout?: "row" | "column"; 
}

// --- Styled Components ---

const Container = styled.div<{ $sticky?: boolean; $divider?: boolean; $safeArea?: boolean }>`
  width: 100%;
  padding: 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  z-index: 100;

  ${(p) => p.$divider && `border-top: 1px solid #f2f4f6;`}
  ${(p) =>
    p.$sticky &&
    `
    position: fixed;
    bottom: 0;
    left: 0;
    box-shadow: 0px -4px 10px rgba(0, 0, 0, 0.04);
  `}
  ${(p) =>
    p.$safeArea &&
    `
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  `}
`;

const Caption = styled.div`
  font-size: 13px;
  color: #6b7684;
  text-align: center;
`;

// ✅ $single 대신 $layout을 받아서 처리하도록 변경
const ButtonGroup = styled.div<{ $layout: "row" | "column" }>`
  display: flex;
  width: 100%;
  gap: 8px;

  /* 세로 정렬 (column) */
  ${(p) =>
    p.$layout === "column" &&
    css`
      flex-direction: column;

      & > * {
        width: 100%;
        flex: none !important;
      }
    `}

  /* 가로 정렬 (row) */
  ${(p) =>
    p.$layout === "row" &&
    css`
      flex-direction: row;

      & > * {
        flex: 1;
        width: auto;
      }
    `}
`;

const StyledButton = styled.button<ActionButtonProps>`
  min-height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  width: 100%;
  transition: background 0.2s;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return css`
          background: var(--Primary-Normal, #1A1815);
          color: white;
          border: none;
        `;
      case "secondary":
        return css`
          background: transparent;
          border: 1px solid var(--Line-Normal-Neutral, rgba(108, 101, 95, 0.16));
          color: var(--Semantic-Label-Normal, #1A1815);
        `;
      case "tertiary":
        return css`
          background: transparent;
          border: none;
          padding: 8px 0;
          min-height: auto;
          font-size: 14px;
          color: var(--color-semantic-label-alternative);
        `;
      case "disabled":
        return css`
            background: var(--Interaction-Disable, #DDD8D3);
            color: var(--Semantic-Label-Assistive, var(--Label-Assistive, rgba(47, 43, 39, 0.28)));
            border: none;
            cursor: not-allowed;
        `;
    }
  }}
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

// --- Components ---

export const ActionButton = ({ children, variant = "primary", icon, ...props }: ActionButtonProps) => {
  return (
    <StyledButton variant={variant} {...props}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {children}
    </StyledButton>
  );
};

export const ActionSheet = ({
  children,
  sticky = false,
  divider = false,
  caption,
  safeArea = true,
  layout, // ✅ layout prop 구조 분해 할당
}: ActionSheetProps) => {
  const childCount = React.Children.count(children);

  // 1. layout prop이 있으면 그 값을 사용
  // 2. 없으면 기존 로직대로 (1개면 column, 2개 이상이면 row)
  const finalLayout = layout || (childCount === 1 ? "column" : "row");

  return (
    <Container $sticky={sticky} $divider={divider} $safeArea={safeArea}>
      {caption && <Caption>{caption}</Caption>}

      {/* ButtonGroup에 결정된 layout 전달 */}
      <ButtonGroup $layout={finalLayout}>{children}</ButtonGroup>
    </Container>
  );
};