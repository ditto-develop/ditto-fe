import styled, { css } from "styled-components";

export const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

export const PageRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const TopNavigation = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  flex-shrink: 0;
`;

export const BackButton = styled.button`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-semantic-label-normal);
`;

export const NavTitle = styled.h2`
  ${textStyle};
  flex: 1;
  margin: 0;
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  text-align: center;
`;

export const NavCount = styled.span`
  flex-shrink: 0;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  font-feature-settings: 'ss10' on;
  font-family: var(--typography-label-1-normal-bold-font-family);
  font-size: var(--typography-label-1-normal-bold-font-size);
  font-style: var(--typography-label-1-normal-bold-font-style);
  font-weight: var(--typography-label-1-normal-bold-font-weight);
  line-height: var(--typography-label-1-normal-bold-line-height);
  letter-spacing: var(--typography-label-1-normal-bold-letter-spacing);
`;

export const Body = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 16px 104px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
`;

export const SectionTitle = styled.h3`
  ${textStyle};
  flex: 1;
  margin: 0;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-headline-1-font-size);
  font-weight: 600;
  line-height: 1.445;
  letter-spacing: -0.018px;
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const OptionRow = styled.button<{ $checked: boolean }>`
  ${textStyle};
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  background-color: ${({ $checked }) =>
    $checked
      ? "var(--color-semantic-background-normal-alternative)"
      : "var(--color-semantic-fill-normal)"};
  border: ${({ $checked }) =>
    $checked
      ? "1px solid var(--color-semantic-primary-normal)"
      : "1px solid transparent"};
  text-align: left;
`;

export const OptionLabel = styled.span<{ $checked: boolean }>`
  ${textStyle};
  flex: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
`;

export const Radio = styled.span<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 1.5px solid
    ${({ $checked }) =>
      $checked
        ? "var(--color-semantic-primary-normal)"
        : "var(--color-semantic-line-normal-neutral)"};
  background-color: ${({ $checked }) =>
    $checked ? "var(--color-semantic-primary-normal)" : "transparent"};
  color: var(--color-semantic-static-white);
`;

export const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background-color: var(--color-semantic-fill-normal);
`;

export const AddOptionButton = styled.button`
  ${textStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background-color: var(--color-semantic-fill-normal);
  color: var(--color-semantic-label-assistive);
  cursor: pointer;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
`;

export const NewInputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--color-semantic-static-white);
  border: 1px solid var(--color-semantic-line-normal-neutral);
`;

export const NewTimeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--color-semantic-static-white);
  border: 1px solid var(--color-semantic-line-normal-neutral);
`;

export const NewInput = styled.input`
  ${textStyle};
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-semantic-line-normal-neutral);
  border-radius: 8px;
  background: transparent;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  outline: none;

  &::placeholder {
    color: var(--color-semantic-label-assistive);
  }
`;

export const TimePickerField = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--color-semantic-line-normal-neutral);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-semantic-label-normal);
`;

export const HiddenDateInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.01;
  cursor: pointer;
  border: 0;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
`;

export const PickerDisplay = styled.span`
  ${textStyle};
  flex: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  color: var(--color-semantic-label-normal);
`;

export const NewInputActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`;

export const TextButton = styled.button<{ $primary?: boolean }>`
  ${textStyle};
  padding: 6px 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  color: ${({ $primary }) =>
    $primary
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-label-alternative)"};
`;

export const ActionArea = styled.footer`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  background-color: var(--color-semantic-background-normal-normal);
  box-sizing: border-box;
`;

export const PrimaryButton = styled.button<{ $active: boolean }>`
  ${textStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 430px;
  min-height: 52px;
  margin: 0 auto;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  background-color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-interaction-disable)"};
  color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-static-white)"
      : "var(--color-semantic-label-assistive)"};
  cursor: ${({ $active }) => ($active ? "pointer" : "not-allowed")};
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.091px;
`;

export const IconSvg = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
`;

export const IconSvgSmall = styled.svg`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

export function ChevronLeftIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  );
}

export function LocationIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
    </IconSvg>
  );
}

export function LocationIconSmall({ $muted }: { $muted?: boolean }) {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: $muted ? "var(--color-semantic-label-assistive)" : "var(--color-semantic-label-normal)" }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
    </IconSvgSmall>
  );
}

export function ClockIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvg>
  );
}

export function ClockIconSmall() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvgSmall>
  );
}

export function CalendarIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvgSmall>
  );
}

export function PlusIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvgSmall>
  );
}

export function CheckIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 12, height: 12 }}>
      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvgSmall>
  );
}
