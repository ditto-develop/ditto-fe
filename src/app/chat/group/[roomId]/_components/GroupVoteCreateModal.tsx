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
import { toMeetAt } from "@/features/chat";
import type { CreateGroupVoteRequest } from "@/features/chat";
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
  /** 생성 요청 본문을 그대로 넘긴다. 선택지는 여기서 확정되며 이후 추가·삭제가 없다. */
  onComplete?: (payload: CreateGroupVoteRequest) => void | Promise<void>;
}

/** 장소·시간 각 2~10개. 서버가 같은 상한으로 검증한다(위반 시 0001). */
const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 10;

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

  const canAddOption =
    voteType === "place"
      ? placeOptions.length < MAX_OPTION_COUNT
      : timeOptions.length < MAX_OPTION_COUNT;

  const handleAddOption = () => {
    if (!canAddOption) return;

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
        allowMultiple,
        placeOptions: validPlaceOptions.map((option) => ({
          label: option.name,
          // 직접 입력이 아닌 검색 결과만 주소·좌표를 갖는다. 빈 값은 아예 보내지 않는다.
          ...(option.address ? { address: option.address } : {}),
          ...(option.mapUrl ? { mapLink: option.mapUrl } : {}),
          ...(typeof option.latitude === "number" ? { latitude: option.latitude } : {}),
          ...(typeof option.longitude === "number" ? { longitude: option.longitude } : {}),
        })),
        // 서버는 meetAt 단일 필드만 받는다. 표시 문구(dateLabel)는 저장하지 않는다.
        timeOptions: validTimeOptions.map((option) => ({
          meetAt: toMeetAt(option.date, option.time),
        })),
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
              <Hint>최소 {MIN_OPTION_COUNT}개 · 최대 {MAX_OPTION_COUNT}개</Hint>
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

              {canAddOption && (
                <AddOptionButton type="button" onClick={handleAddOption}>
                  <PlusIcon aria-hidden="true" />
                  항목 추가
                </AddOptionButton>
              )}
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
