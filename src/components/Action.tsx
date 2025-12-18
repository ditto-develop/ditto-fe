"use client";

import React from "react";
import styled, { css } from "styled-components";

// --- Types ---
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "disabled";
  flex?: number;
  fullWidth?: boolean;
}

interface ActionSheetProps {
  children: React.ReactNode;
  sticky?: boolean;
  divider?: boolean;
  caption?: string;
  safeArea?: boolean;
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

const ButtonGroup = styled.div<{ $single?: boolean }>`
  display: flex;
  width: 100%;
  gap: 8px;

  /* 1개일 때: column + full width */
  ${(p) =>
    p.$single &&
    css`
      flex-direction: column;

      & > * {
        width: 100%;
        flex: none !important;
      }
    `}

  /* 2개 이상일 때: row + 균등 분배 */
  ${(p) =>
    !p.$single &&
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

  width: 100%; /* 1개일 때 동작 */
  transition: background 0.2s;

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
          border: 1px solid
          var(--Line-Normal-Neutral, rgba(108, 101, 95, 0.16));
          color: var(--Semantic-Label-Normal, #1A1815);
        `;
      case "tertiary":
        return css`
          background: transparent;
          border: none;
          padding: 8px 0;
          min-height: auto;
          font-size: 14px;
          color: var(--color-label-alternative);
        `;
      case "disabled":
        return css`
            background: var(--Interaction-Disable, #DDD8D3);
            color: var(--Semantic-Label-Assistive, var(--Label-Assistive, rgba(47, 43, 39, 0.28)));
            border: none;
        `;
    }
  }}
`;


// --- Components ---

export const ActionButton = ({ children, variant = "primary", ...props }: ActionButtonProps) => {
  return (
    <StyledButton variant={variant} {...props}>
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
}: ActionSheetProps) => {
  const childArray = React.Children.toArray(children);
  const isSingle = childArray.length === 1;

  return (
    <Container $sticky={sticky} $divider={divider} $safeArea={safeArea}>
      {caption && <Caption>{caption}</Caption>}

      <ButtonGroup $single={isSingle}>{children}</ButtonGroup>
    </Container>
  );
};

