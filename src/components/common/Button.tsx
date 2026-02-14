import styled, { css } from "styled-components";

type ButtonVariant = "solid" | "outlined" | "text";
type ButtonTheme = "primary" | "secondary" | "assistive";
type ButtonSize = "large" | "medium" | "small";

interface ButtonProps {
    $variant?: ButtonVariant;
    $theme?: ButtonTheme;
    $size?: ButtonSize;
    $iconOnly?: boolean;
    disabled?: boolean;
}

const sizeStyles = {
    large: css`
    height: 48px;
    padding: 0 20px;
    font-size: 16px;
    border-radius: 12px;
  `,
    medium: css`
    height: 40px;
    padding: 0 16px;
    font-size: 14px;
    border-radius: 10px;
  `,
    small: css`
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    border-radius: 8px;
  `,
};

const iconOnlyStyles = {
    large: css`
    width: 48px;
    padding: 0;
  `,
    medium: css`
    width: 40px;
    padding: 0;
  `,
    small: css`
    width: 32px;
    padding: 0;
  `,
};

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;

  /* Size Styles */
  ${({ $size = "medium" }) => sizeStyles[$size]}
  ${({ $iconOnly, $size = "medium" }) => $iconOnly && iconOnlyStyles[$size]}

  /* Variant & Theme Styles */
  /* Solid */
  ${({ $variant = "solid", $theme = "primary" }) =>
        $variant === "solid" &&
        $theme === "primary" &&
        css`
      background-color: var(--color-semantic-primary-normal);
      color: var(--color-semantic-static-white);
      &:hover {
        background-color: var(--color-semantic-primary-hover);
      }
      &:active {
        background-color: var(--color-semantic-primary-selected);
      }
      &:disabled {
        background-color: var(--color-semantic-interaction-disable);
        color: var(--color-semantic-label-disable);
        cursor: not-allowed;
      }
    `}

  ${({ $variant = "solid", $theme = "secondary" }) =>
        $variant === "solid" &&
        $theme === "secondary" &&
        css`
      background-color: var(--color-atomic-coolNeutral-20); /* fallback or derived */
      color: var(--color-semantic-static-white);
      /* Add specific secondary tokens if available */
    `}

  /* Outlined */
  ${({ $variant = "outlined", $theme = "primary" }) =>
        $variant === "outlined" &&
        css`
      background-color: transparent;
      border-color: var(--color-semantic-line-normal-normal); // Check semantic token
      color: var(--color-semantic-label-normal);
      
      &:hover {
        background-color: var(--color-component-fill-normal);
      }
      &:disabled {
         border-color: var(--color-semantic-interaction-disable);
         color: var(--color-semantic-label-disable);
         cursor: not-allowed;
      }
    `}

  /* Text */
  ${({ $variant = "text" }) =>
        $variant === "text" &&
        css`
      background-color: transparent;
      color: var(--color-semantic-label-normal);
      
      &:hover {
        background-color: var(--color-component-fill-normal);
      }
      &:disabled {
        color: var(--color-semantic-label-disable);
         cursor: not-allowed;
      }
    `}
`;
