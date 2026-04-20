import styled, { css } from "styled-components";

type DividerVariant = "normal" | "strong" | "thick";
type DividerOrientation = "horizontal" | "vertical";

interface DividerProps {
    $variant?: DividerVariant;
    $orientation?: DividerOrientation;
}

export const Divider = styled.div<DividerProps>`
  background-color: var(--color-semantic-line-normal-normal); // Default
  flex-shrink: 0;

  /* Horizontal */
  ${({ $orientation = "horizontal", $variant = "normal" }) =>
        $orientation === "horizontal" &&
        css`
      width: 100%;
      height: 1px;
      
      ${$variant === "thick" &&
            css`
        height: 12px;
        background-color: var(--color-semantic-background-normal-alternative); // Thick divider usually lighter/bg color
      `}
    `}

  /* Vertical */
  ${({ $orientation = "vertical", $variant = "normal" }) =>
        $orientation === "vertical" &&
        css`
      width: 1px;
      height: 100%; // Or specific height if needed
      min-height: 1em;
      display: inline-block;
      
       ${$variant === "thick" &&
            css`
        width: 12px;
         background-color: var(--color-semantic-background-normal-alternative);
      `}
    `}
`;
