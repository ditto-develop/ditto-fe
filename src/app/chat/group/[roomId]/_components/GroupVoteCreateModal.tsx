"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import styled, { css } from "styled-components";

type VoteType = "place" | "time";

type TimeOption = {
  date: string;
  time: string;
};

interface GroupVoteCreateModalProps {
  onClose: () => void;
  onComplete?: (payload: {
    placeOptions: string[];
    timeOptions: Array<TimeOption & { dateLabel: string }>;
    allowMultiple: boolean;
  }) => void;
}

const MIN_OPTION_COUNT = 2;

function formatDateLabel(value: string) {
  if (!value) return "날짜 선택";

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  return `${month}월 ${day}일 ${weekdays[date.getDay()]}`;
}

function formatTimeLabel(value: string) {
  if (!value) return "시간 선택";

  const [hourValue, minuteValue] = value.split(":").map(Number);
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return value;

  const period = hourValue < 12 ? "오전" : "오후";
  const hour = hourValue % 12 || 12;
  const minute = minuteValue > 0 ? ` ${minuteValue}분` : "";

  return `${period} ${hour}시${minute}`;
}

type NativePickerFieldProps = {
  type: "date" | "time";
  value: string;
  label: string;
  isPlaceholder: boolean;
  subtle?: boolean;
  ariaLabel: string;
  icon: React.ReactNode;
  onChange: (value: string) => void;
};

function NativePickerField({
  type,
  value,
  label,
  isPlaceholder,
  subtle,
  ariaLabel,
  icon,
  onChange,
}: NativePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpeningRef = useRef(false);

  const openPicker = () => {
    if (isOpeningRef.current) return;

    const input = inputRef.current;
    if (!input) return;

    isOpeningRef.current = true;
    input.focus();

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    } finally {
      window.setTimeout(() => {
        isOpeningRef.current = false;
      }, 0);
    }
  };

  return (
    <TimeInputRow
      role="button"
      tabIndex={0}
      $subtle={subtle}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
    >
      {icon}
      <PickerLabel $placeholder={isPlaceholder}>{label}</PickerLabel>
      <HiddenPickerInput
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </TimeInputRow>
  );
}

export function GroupVoteCreateModal({
  onClose,
  onComplete,
}: GroupVoteCreateModalProps) {
  const [voteType, setVoteType] = useState<VoteType>("place");
  const [placeOptions, setPlaceOptions] = useState<string[]>(["", ""]);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([
    { date: "", time: "" },
    { date: "", time: "" },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const validPlaceOptions = useMemo(
    () => placeOptions.filter((option) => option.trim().length > 0),
    [placeOptions]
  );

  const validTimeOptions = useMemo(
    () =>
      timeOptions.filter(
        (option) => option.date.trim().length > 0 && option.time.trim().length > 0
      ),
    [timeOptions]
  );

  const isPlaceValid = validPlaceOptions.length >= MIN_OPTION_COUNT;
  const isTimeValid = validTimeOptions.length >= MIN_OPTION_COUNT;
  const canProceed = voteType === "place" ? isPlaceValid : isTimeValid;

  const handleBack = () => {
    if (voteType === "time") {
      setVoteType("place");
      setSubmitted(false);
      return;
    }

    onClose();
  };

  const handleAddOption = () => {
    if (voteType === "place") {
      setPlaceOptions((prev) => [...prev, ""]);
      return;
    }

    setTimeOptions((prev) => [...prev, { date: "", time: "" }]);
  };

  const handlePrimaryClick = () => {
    setSubmitted(true);

    if (!canProceed) return;

    if (voteType === "place") {
      setVoteType("time");
      setSubmitted(false);
      return;
    }

    onComplete?.({
      placeOptions: validPlaceOptions,
      timeOptions: validTimeOptions.map((option) => ({
        ...option,
        dateLabel: `${formatDateLabel(option.date)} ${formatTimeLabel(option.time)}`,
      })),
      allowMultiple,
    });
    onClose();
  };

  return (
    <ModalRoot role="dialog" aria-modal="true" aria-labelledby="group-vote-title">
      <TopNavigation>
        <IconButton type="button" onClick={handleBack} aria-label="뒤로가기">
          <ChevronLeftIcon aria-hidden="true" />
        </IconButton>
        <Title id="group-vote-title">투표 만들기</Title>
        <NavigationFiller aria-hidden="true" />
      </TopNavigation>

      <Body>
        <Wrapper>
          <Section>
            <Heading>투표 유형</Heading>
            <ChipRow>
              <StepChip $active={voteType === "place"} $done={voteType === "time"}>
                장소
              </StepChip>
              <StepChip $active={voteType === "time"} $done={false}>
                시간
              </StepChip>
            </ChipRow>
          </Section>

          <Section>
            <HeadingRow>
              <Heading>옵션</Heading>
              <Hint>최소 2개</Hint>
            </HeadingRow>

            <OptionList>
              {voteType === "place" ? (
                <>
                  {placeOptions.map((option, index) => {
                    const hasError = submitted && option.trim().length === 0;

                    return (
                      <OptionFieldGroup key={`place-${index}`}>
                        <TextOptionField $error={hasError}>
                          <LinkIcon aria-hidden="true" />
                          <OptionInput
                            value={option}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setPlaceOptions((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? nextValue : item
                                )
                              );
                            }}
                            placeholder="지도 링크를 입력해 주세요."
                            aria-label={`장소 옵션 ${index + 1}`}
                          />
                        </TextOptionField>
                        {hasError && <ErrorMessage>링크를 입력해 주세요.</ErrorMessage>}
                      </OptionFieldGroup>
                    );
                  })}
                </>
              ) : (
                <>
                  {timeOptions.map((option, index) => {
                    const hasError =
                      submitted &&
                      (option.date.trim().length === 0 || option.time.trim().length === 0);

                    return (
                      <OptionFieldGroup key={`time-${index}`}>
                        <TimeOptionCard $error={hasError}>
                          <NativePickerField
                              type="date"
                              value={option.date}
                            label={formatDateLabel(option.date)}
                            isPlaceholder={!option.date}
                            icon={<CalendarIcon aria-hidden="true" />}
                            ariaLabel={`시간 옵션 ${index + 1} 날짜`}
                            onChange={(nextValue) => {
                                setTimeOptions((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, date: nextValue } : item
                                  )
                                );
                              }}
                            />
                          <NativePickerField
                              type="time"
                              value={option.time}
                            label={formatTimeLabel(option.time)}
                            isPlaceholder={!option.time}
                            subtle
                            icon={<ClockIcon aria-hidden="true" />}
                            ariaLabel={`시간 옵션 ${index + 1} 시간`}
                            onChange={(nextValue) => {
                                setTimeOptions((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, time: nextValue } : item
                                  )
                                );
                              }}
                            />
                        </TimeOptionCard>
                        {hasError && <ErrorMessage>옵션을 선택해 주세요.</ErrorMessage>}
                      </OptionFieldGroup>
                    );
                  })}
                </>
              )}

              <AddOptionButton type="button" onClick={handleAddOption}>
                <PlusIcon aria-hidden="true" />
                항목 추가
              </AddOptionButton>
            </OptionList>
          </Section>

          <MultipleSelectButton
            type="button"
            onClick={() => setAllowMultiple((prev) => !prev)}
            aria-pressed={allowMultiple}
          >
            <RadioCircle $checked={allowMultiple}>
              {allowMultiple && <RadioDot />}
            </RadioCircle>
            복수 선택
          </MultipleSelectButton>
        </Wrapper>
      </Body>

      <ActionArea>
        <PrimaryButton
          type="button"
          onClick={handlePrimaryClick}
          $active={canProceed}
        >
          {voteType === "place" ? "다음" : "완료"}
        </PrimaryButton>
      </ActionArea>
    </ModalRoot>
  );
}

const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

const ModalRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
`;

const TopNavigation = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  height: 56px;
  padding: 16px;
  box-sizing: border-box;
  flex-shrink: 0;
`;

const IconButton = styled.button`
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

const NavigationFiller = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

const Title = styled.h2`
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

const Body = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 16px 120px;
  box-sizing: border-box;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Heading = styled.p`
  ${textStyle};
  margin: 0;
  color: var(--color-semantic-label-neutral);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: 1.429;
  letter-spacing: 0.203px;
`;

const Hint = styled.span`
  ${textStyle};
  color: var(--color-semantic-label-alternative);
  font-size: var(--typography-caption-1-font-size);
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0.302px;
`;

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
`;

const StepChip = styled.span<{ $active: boolean; $done: boolean }>`
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

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const fieldShell = css<{ $error?: boolean }>`
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

const TextOptionField = styled.div<{ $error?: boolean }>`
  ${fieldShell};
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
`;

const TimeOptionCard = styled.div<{ $error?: boolean }>`
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

const TimeInputRow = styled.div<{ $subtle?: boolean }>`
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

const PickerLabel = styled.span<{ $placeholder: boolean }>`
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

const HiddenPickerInput = styled.input`
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

const OptionInput = styled.input`
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

const ErrorMessage = styled.p`
  ${textStyle};
  width: 100%;
  margin: 0;
  color: var(--color-semantic-status-negative);
  font-size: var(--typography-caption-1-font-size);
  font-weight: 400;
  line-height: 1.334;
  letter-spacing: 0.302px;
`;

const AddOptionButton = styled.button`
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

const MultipleSelectButton = styled.button`
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

const RadioCircle = styled.span<{ $checked: boolean }>`
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

const RadioDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background-color: var(--color-semantic-static-white);
`;

const ActionArea = styled.footer`
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

const PrimaryButton = styled.button<{ $active: boolean }>`
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

const IconSvg = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--color-semantic-label-assistive);
`;

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
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

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
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

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.8V12L14.8 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvg>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
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
