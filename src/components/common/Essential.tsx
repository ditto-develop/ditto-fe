import styled from "styled-components";

/*
 * Essential Components
 * Used for safe area management or standard system bar placeholders.
 */

export const StatusBar = styled.div`
  width: 100%;
  height: 44px; /* Standard iOS height, adjustable */
  background-color: transparent;
  flex-shrink: 0;
`;

export const HomeBar = styled.div`
  width: 100%;
  height: 34px; /* Standard iOS bottom safe area */
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 8px;
  flex-shrink: 0;
  
  &::after {
    content: "";
    width: 128px;
    height: 5px;
    background-color: var(--color-atomic-neutral-10); /* Or appropriate token */
    border-radius: 100px;
  }
`;
