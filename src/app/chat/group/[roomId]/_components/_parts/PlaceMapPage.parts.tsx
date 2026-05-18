import styled, { css } from "styled-components";

export const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

export const PageRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2300;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const TopBar = styled.header`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-semantic-label-normal);
  cursor: pointer;
`;

export const Title = styled.h1`
  ${textStyle};
  position: absolute;
  left: 50%;
  margin: 0;
  transform: translateX(-50%);
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
`;

export const MapArea = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
`;

export const MapContainer = styled.div`
  position: absolute;
  inset: 0;
`;

export const MapControlLayer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MapControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--color-semantic-line-normal-neutral);
  border-radius: 12px;
  background-color: var(--color-semantic-static-white);
  color: var(--color-semantic-label-normal);
  cursor: pointer;
`;

export const EmptyState = styled.div`
  ${textStyle};
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--color-semantic-label-alternative);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const LoadingState = styled(EmptyState)``;

export const BottomCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  padding: 22px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  background-color: var(--color-semantic-background-normal-normal);
`;

export const PlaceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.h2`
  ${textStyle};
  margin: 0;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-headline-1-font-size);
  font-weight: 600;
  line-height: 1.445;
`;

export const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Address = styled.p`
  ${textStyle};
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--color-semantic-label-alternative);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
`;

export const CopyButton = styled.button`
  ${textStyle};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: var(--color-semantic-primary-normal);
  cursor: pointer;
  font-size: var(--typography-label-2-font-size);
  font-weight: 600;
  line-height: 1.385;
`;

export const VoteButton = styled.button`
  ${textStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 42px;
  padding: 9px 28px;
  border: 0;
  border-radius: 10px;
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);
  cursor: pointer;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: 1.467;
`;
