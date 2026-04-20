import type React from "react";
import styled, { css } from "styled-components";

export const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

export const ModalRoot = styled.div`
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
  width: 100%;
  height: 56px;
  padding: 16px;
  box-sizing: border-box;
  flex-shrink: 0;
`;

export const IconButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
`;

export const NavigationFiller = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

export const Title = styled.h2`
  ${textStyle};
  flex: 1;
  margin: 0;
  padding: 0 32px;
  overflow: hidden;
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Body = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 16px 120px;
  box-sizing: border-box;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const Heading = styled.p`
  ${textStyle};
  margin: 0;
  color: var(--color-semantic-label-neutral);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: 1.429;
  letter-spacing: 0.203px;
`;

export const Hint = styled.span`
  ${textStyle};
  color: var(--color-semantic-label-alternative);
  font-size: var(--typography-caption-1-font-size);
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0.302px;
`;

export const ChipRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const StepChip = styled.span<{ $active: boolean; $done: boolean }>`
  ${textStyle};
  width: 66px;
  min-height: 37px;
  padding: 7px 11px;
  border: none;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  pointer-events: none;
  user-select: none;
  color: ${({ $active, $done }) =>
    $active
      ? "var(--color-semantic-inverse-label)"
      : $done
        ? "var(--color-semantic-label-alternative)"
        : "var(--color-semantic-label-assistive)"};
  background-color: ${({ $active, $done }) =>
    $active
      ? "var(--color-semantic-primary-normal)"
      : $done
        ? "var(--color-component-fill-alternative, rgba(108, 101, 95, 0.05))"
        : "var(--color-component-fill-alternative, rgba(108, 101, 95, 0.05))"};
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const OptionFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const fieldShell = css<{ $error?: boolean }>`
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  border: 1px solid
    ${({ $error }) =>
      $error
        ? "rgba(179, 53, 40, 0.28)"
        : "var(--color-semantic-line-normal-neutral)"};
  border-radius: 12px;
  background-color: transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

export const TextOptionField = styled.div<{ $error?: boolean }>`
  ${fieldShell};
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
`;

export const TimeOptionCard = styled.div<{ $error?: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid
    ${({ $error }) =>
      $error
        ? "rgba(179, 53, 40, 0.28)"
        : "var(--color-semantic-line-normal-neutral)"};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

export const TimeInputRow = styled.div<{ $subtle?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 48px;
  padding: 12px;
  box-sizing: border-box;
  background-color: ${({ $subtle }) =>
    $subtle
      ? "rgba(221, 216, 211, 0.52)"
      : "transparent"};
  cursor: pointer;

  & + & {
    border-top: 1px solid
      var(--color-semantic-line-normal-neutral);
  }
`;

export const PickerLabel = styled.span<{ $placeholder: boolean }>`
  ${textStyle};
  flex: 1;
  min-width: 0;
  padding: 0 4px;
  overflow: hidden;
  color: ${({ $placeholder }) =>
    $placeholder
      ? "var(--color-semantic-label-assistive)"
      : "var(--color-semantic-label-normal)"};
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.091px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const HiddenPickerInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  color: transparent;
  opacity: 0.01;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;

  &::-webkit-calendar-picker-indicator {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

export const OptionInput = styled.input`
  ${textStyle};
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0 4px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.091px;

  &::placeholder {
    color: var(--color-semantic-label-assistive);
    opacity: 1;
  }
`;

export const ErrorMessage = styled.p`
  ${textStyle};
  width: 100%;
  margin: 0;
  color: var(--color-semantic-status-negative);
  font-size: var(--typography-caption-1-font-size);
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0.302px;
`;

export const AddOptionButton = styled.button`
  ${textStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-height: 48px;
  padding: 12px;
  border: 1px solid var(--color-semantic-line-normal-neutral);
  border-radius: 12px;
  background: transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  color: var(--color-semantic-label-alternative);
  cursor: pointer;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.091px;
`;

export const MultipleSelectButton = styled.button`
  ${textStyle};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-semantic-label-neutral);
  cursor: pointer;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.091px;
`;

export const RadioCircle = styled.span<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border: 1.5px solid
    ${({ $checked }) =>
      $checked
        ? "var(--color-semantic-primary-normal)"
        : "var(--color-semantic-line-normal-normal)"};
  border-radius: 9999px;
  background-color: ${({ $checked }) =>
    $checked ? "var(--color-semantic-primary-normal)" : "transparent"};
`;

export const RadioDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background-color: var(--color-semantic-static-white);
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
  min-height: 48px;
  margin: 0 auto;
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  background-color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-interaction-disable)"};
  color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-static-white)"
      : "var(--color-semantic-label-assistive)"};
  cursor: pointer;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.091px;
`;

export const IconSvg = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--color-semantic-label-assistive);
`;

export function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M10 13.5L14 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.8 10.7L7.4 12.1C5.9 13.6 5.9 16.1 7.4 17.6C8.9 19.1 11.4 19.1 12.9 17.6L14.3 16.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.2 13.3L16.6 11.9C18.1 10.4 18.1 7.9 16.6 6.4C15.1 4.9 12.6 4.9 11.1 6.4L9.7 7.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}

export function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M8 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvg>
  );
}

export function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.8V12L14.8 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvg>
  );
}

export function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvg>
  );
}

export function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M15 5L8 12L15 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}
