import styled, { css } from "styled-components";

export function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LocationIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5V12L15 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InlineCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M5 10.5L8.5 14L15 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Styled Components ── */

const fontBase = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const TopNav = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  flex-shrink: 0;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const BackButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: var(--color-semantic-label-normal);

  &:active {
    opacity: 0.6;
  }
`;

export const NavTitle = styled.h1`
  ${fontBase}
  flex: 1;
  margin: 0;
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  text-align: center;
  color: var(--color-semantic-label-strong);
`;

export const VoteCounter = styled.span`
  ${fontBase}
  font-size: var(--typography-headline-2-font-size);
  font-weight: 400;
  line-height: 1.412;
  color: var(--color-semantic-label-alternative);
`;

export const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SectionHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-semantic-label-normal);
`;

export const SectionIcon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const SectionTitle = styled.h2`
  ${fontBase}
  margin: 0;
  font-size: var(--typography-headline-1-font-size);
  font-weight: 600;
  line-height: 1.445;
  letter-spacing: -0.004px;
  color: var(--color-semantic-label-normal);
`;

export const SectionSubtext = styled.p`
  ${fontBase}
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 400;
  line-height: 1.429;
  letter-spacing: 0.203px;
  color: var(--color-semantic-label-normal);
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const OptionCard = styled.button<{
  $isWinner: boolean;
  $hasVotes: boolean;
  $isAllVoted: boolean;
  $clickable?: boolean;
}>`
  ${fontBase}
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: opacity 0.15s ease;
  overflow: hidden;
  box-sizing: border-box;

  ${({ $isWinner, $isAllVoted }) => {
    if ($isWinner) {
      return $isAllVoted
        ? css`
            background-color: var(
              --color-semantic-background-normal-alternative,
              var(--color-semantic-line-solid-neutral)
            );
            border: 1px solid transparent;
          `
        : css`
            background-color: var(
              --color-semantic-background-normal-alternative,
              var(--color-semantic-line-solid-neutral)
            );
            border: 1px solid transparent;
          `;
    }
    return css`
      background-color: transparent;
      border: 1px solid
        var(--color-semantic-line-normal-neutral);
    `;
  }}

  ${({ $isWinner, $isAllVoted }) =>
    $isAllVoted &&
    !$isWinner &&
    css`
      opacity: 0.74;
    `}

  ${({ $clickable }) =>
    $clickable &&
    css`
      &:active {
        opacity: 0.78;
      }
    `}
`;

export const OptionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
`;

export const OptionLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--color-semantic-label-normal);
`;

export const OptionLabel = styled.span`
  ${fontBase}
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
`;

export const VoteCount = styled.span`
  ${fontBase}
  flex-shrink: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: 400;
  line-height: 1.385;
  letter-spacing: 0.252px;
  color: var(--color-semantic-label-alternative);
`;

export const VotersLine = styled.p`
  ${fontBase}
  margin: 0;
  font-size: var(--typography-caption-1-font-size);
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0.302px;
  color: var(--color-semantic-label-alternative);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProgressTrack = styled.div`
  position: relative;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background-color: var(--color-semantic-fill-normal);
  overflow: hidden;
  margin-top: 8px;
`;

export const ProgressFill = styled.div`
  height: 100%;
  border-radius: 2px;
  background-color: var(--color-semantic-primary-normal);
  transition: width 0.3s ease;
`;

export const BottomSpacer = styled.div`
  height: 24px;
  flex-shrink: 0;
`;

export const ActionArea = styled.div`
  flex-shrink: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
  background-color: var(--color-semantic-background-normal-normal);
`;

export const ActionButton = styled.button`
  ${fontBase}
  width: 100%;
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.091px;

  &:active {
    opacity: 0.82;
  }
`;
