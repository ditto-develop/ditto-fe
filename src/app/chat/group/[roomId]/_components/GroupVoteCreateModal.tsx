"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  ActionArea,
  AddOptionButton,
  Body,
  CalendarIcon,
  ChevronLeftIcon,
  ChipRow,
  ClockIcon,
  ErrorMessage,
  Heading,
  HeadingRow,
  HiddenPickerInput,
  Hint,
  IconButton,
  LocationIcon,
  ModalRoot,
  MultipleSelectButton,
  NavigationFiller,
  OptionFieldGroup,
  OptionList,
  PickerLabel,
  PlaceOptionContent,
  PlaceOptionField,
  PlaceOptionLabel,
  PlaceOptionMeta,
  PlusIcon,
  PrimaryButton,
  RadioCircle,
  RadioDot,
  Section,
  StepChip,
  TimeInputRow,
  TimeOptionCard,
  Title,
  TopNavigation,
  Wrapper,
} from "./_parts/GroupVoteCreateModal.parts";
import { PlaceSearchModal } from "./PlaceSearchModal";
import type { SelectedPlace } from "./PlaceSearchModal";

type VoteType = "place" | "time";

type PlaceOption = SelectedPlace;

type TimeOption = {
  date: string;
  time: string;
};

interface GroupVoteCreateModalProps {
  onClose: () => void;
  onComplete?: (payload: {
    placeOptions: PlaceOption[];
    timeOptions: Array<TimeOption & { dateLabel: string }>;
    allowMultiple: boolean;
  }) => void | Promise<void>;
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
  const [placeOptions, setPlaceOptions] = useState<Array<PlaceOption | null>>([null, null]);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([
    { date: "", time: "" },
    { date: "", time: "" },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placeSearchTarget, setPlaceSearchTarget] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const validPlaceOptions = useMemo(
    () =>
      placeOptions.filter(
        (option): option is PlaceOption =>
          option !== null && option.name.trim().length > 0
      ),
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
      setPlaceOptions((prev) => [...prev, null]);
      return;
    }

    setTimeOptions((prev) => [...prev, { date: "", time: "" }]);
  };

  const handlePrimaryClick = async () => {
    if (isSubmitting) return;

    setSubmitted(true);
    setSubmitError(null);

    if (!canProceed) return;

    if (voteType === "place") {
      setVoteType("time");
      setSubmitted(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await onComplete?.({
        placeOptions: validPlaceOptions,
        timeOptions: validTimeOptions.map((option) => ({
          ...option,
          dateLabel: `${formatDateLabel(option.date)} ${formatTimeLabel(option.time)}`,
        })),
        allowMultiple,
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "투표를 생성할 수 없습니다.");
    } finally {
      setIsSubmitting(false);
    }
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
                    const hasError = submitted && option === null;

                    return (
                      <OptionFieldGroup key={`place-${index}`}>
                        <PlaceOptionField
                          type="button"
                          $error={hasError}
                          onClick={() => setPlaceSearchTarget(index)}
                          aria-label={`장소 옵션 ${index + 1}`}
                        >
                          <LocationIcon aria-hidden="true" />
                          <PlaceOptionContent>
                            <PlaceOptionLabel $placeholder={!option}>
                              {option ? option.name : "장소 선택"}
                            </PlaceOptionLabel>
                            {option && <PlaceOptionMeta>{option.address}</PlaceOptionMeta>}
                          </PlaceOptionContent>
                        </PlaceOptionField>
                        {hasError && <ErrorMessage>장소를 선택해 주세요.</ErrorMessage>}
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
        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
        <PrimaryButton
          type="button"
          onClick={handlePrimaryClick}
          $active={canProceed && !isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "생성 중..." : voteType === "place" ? "다음" : "완료"}
        </PrimaryButton>
      </ActionArea>

      {placeSearchTarget !== null && (
        <PlaceSearchModal
          onClose={() => setPlaceSearchTarget(null)}
          onSelect={(place) => {
            setPlaceOptions((prev) =>
              prev.map((item, itemIndex) =>
                itemIndex === placeSearchTarget ? place : item
              )
            );
          }}
        />
      )}
    </ModalRoot>
  );
}
