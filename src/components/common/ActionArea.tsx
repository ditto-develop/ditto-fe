import styled, { css } from "styled-components";
import { BaseText } from "./Text";

/**
 * Action Area
 * Figma: Action Area [16215:35519]
 * 사용자가 인터페이스를 통해 상호작용할 수 있는 공간을 제공합니다.
 */

type ActionAreaProps = {
    $active?: boolean;
    disabled?: boolean;
};

export const ActionArea = styled.div<ActionAreaProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 56px;
  padding: 12px 20px;
  background-color: var(--color-semantic-background-normal-normal);
  cursor: pointer;
  transition: background-color 0.2s;

  ${({ disabled }) =>
        disabled &&
        css`
      cursor: not-allowed;
      opacity: 0.5;
      pointer-events: none;
    `}

  &:active {
    background-color: var(--color-semantic-interaction-inactive);
  }

  /* Interaction states from Figma tokens if available */
  /* --color-semantic-interaction-inactive: var(--color-atomic-neutral-60); */
`;

export const ActionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ActionTitle = styled(BaseText).attrs({ as: "h4" })`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-semantic-label-normal);
`;

export const ActionDescription = styled(BaseText).attrs({ as: "p" })`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
`;

export const ActionExtra = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
