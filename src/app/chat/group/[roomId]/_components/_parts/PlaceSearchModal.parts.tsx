import styled, { css } from "styled-components";

export const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

export const ModalRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const TopNavigation = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--space-14);
  padding: var(--space-4);
  box-sizing: border-box;
  flex-shrink: 0;
`;

export const IconButton = styled.button`
  width: var(--space-6);
  height: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-0);
  border: none;
  background: none;
  color: var(--color-semantic-label-normal);
  cursor: pointer;

  svg {
    width: var(--space-6);
    height: var(--space-6);
  }
`;

export const NavigationFiller = styled.div`
  width: var(--space-6);
  height: var(--space-6);
  flex-shrink: 0;
`;

export const Title = styled.h2`
  ${textStyle};
  flex: 1;
  margin: var(--space-0);
  padding: var(--space-0) var(--space-8);
  overflow: hidden;
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-headline-2-font-size);
  font-weight: var(--typography-headline-2-font-weight);
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SearchSection = styled.div`
  width: 100%;
  max-width: var(--space-max);
  margin: var(--space-0) auto;
  padding: var(--space-0) var(--space-4);
  box-sizing: border-box;
`;

export const SearchField = styled.label<{ $focused: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-6px);
  width: 100%;
  min-height: var(--space-12);
  padding: var(--space-3);
  border: ${({ $focused }) => ($focused ? "2px" : "1px")} solid
    ${({ $focused }) =>
      $focused
        ? "var(--color-semantic-primary-normal)"
        : "var(--color-semantic-line-normal-neutral)"};
  border-radius: var(--space-3);
  box-sizing: border-box;
  color: var(--color-semantic-label-assistive);
`;

export const SearchInput = styled.input`
  ${textStyle};
  flex: 1;
  min-width: var(--space-0);
  padding: var(--space-0) var(--space-1);
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);

  &::placeholder {
    color: var(--color-semantic-label-assistive);
    opacity: 1;
  }
`;

export const ClearButton = styled.button`
  width: var(--space-6);
  height: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-0);
  border: none;
  background: none;
  color: var(--color-semantic-label-assistive);
  cursor: pointer;

  svg {
    width: var(--space-5);
    height: var(--space-5);
  }
`;

export const ResultList = styled.div`
  flex: 1;
  min-height: var(--space-0);
  width: 100%;
  max-width: var(--space-max);
  margin: var(--space-0) auto;
  padding: var(--space-6) var(--space-4) calc(var(--space-10) + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  box-sizing: border-box;
`;

export const ResultStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

export const ResultRow = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-0);
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
`;

export const ResultIconBox = styled.span`
  width: var(--space-9);
  height: var(--space-9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--space-2);
  background-color: var(--color-semantic-interaction-disable);
  color: var(--color-semantic-label-assistive);
  flex-shrink: 0;

  svg {
    width: var(--space-5);
    height: var(--space-5);
  }
`;

export const ResultContent = styled.span`
  display: flex;
  flex: 1;
  min-width: var(--space-0);
  flex-direction: column;
  gap: var(--spacing-2px);
`;

export const ResultTitle = styled.span`
  ${textStyle};
  overflow: hidden;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ResultTitleHighlight = styled.span`
  font-weight: var(--typography-label-1-normal-font-weight);
`;

export const ResultAddress = styled.span`
  ${textStyle};
  overflow: hidden;
  color: var(--color-semantic-label-alternative);
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FeedbackText = styled.p`
  ${textStyle};
  margin: var(--space-0);
  color: var(--color-semantic-label-alternative);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
`;
