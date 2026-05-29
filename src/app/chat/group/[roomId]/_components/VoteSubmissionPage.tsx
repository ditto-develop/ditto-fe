"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type {
  CastVoteDto,
  GroupVoteDto,
  VotePlaceOptionDto,
  VoteTimeOptionDto,
} from "@/shared/lib/api/generated";
import { AddVoteOptionDto, ChatService } from "@/shared/lib/api/generated";
import {
  ActionArea,
  AddOptionButton,
  BackButton,
  Body,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  ClockIconSmall,
  HiddenDateInput,
  LocationIcon,
  LocationIconSmall,
  MapPinButton,
  NavCount,
  NavTitle,
  NewInputRow,
  NewPlaceField,
  NewPlaceIcon,
  NewPlaceText,
  NewTimeFieldGroup,
  NewTimeRow,
  OptionLabel,
  OptionList,
  OptionRow,
  PageRoot,
  PickerDisplay,
  PlusIcon,
  PrimaryButton,
  Radio,
  Section,
  SectionHeader,
  SectionTitle,
  TimePickerField,
  TopNavigation,
} from "./_parts/VoteSubmissionPage.parts";
import { PlaceMapPage } from "./PlaceMapPage";
import { PlaceSearchModal } from "./PlaceSearchModal";
import type { SelectedPlace } from "./PlaceSearchModal";

interface VoteSubmissionPageProps {
  vote: GroupVoteDto;
  roomId: string;
  onClose: () => void;
  onVoted: (updatedVote: GroupVoteDto) => void;
  /** 실패/모킹 시 fallback — page client가 로컬 상태 업데이트를 처리 */
  onLocalVote?: (payload: CastVoteDto) => GroupVoteDto;
  onLocalAddPlace?: (label: string) => GroupVoteDto;
  onLocalAddTime?: (draft: { dateLabel: string; date: string; time: string }) => GroupVoteDto;
}

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function formatTimeLabel(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  const minute = m > 0 ? ` ${m}분` : "";
  return `${period} ${hour}시${minute}`;
}

function formatDateLabelFromInputs(date: string, time: string): string {
  if (!date || !time) return "";
  const [y, mo, d] = date.split("-").map(Number);
  if (!y || !mo || !d) return "";
  const dt = new Date(y, mo - 1, d);
  return `${mo}월 ${d}일 ${WEEKDAYS[dt.getDay()]} ${formatTimeLabel(time)}`;
}

function hasPlaceCoordinates(option: VotePlaceOptionDto) {
  return typeof option.latitude === "number" && typeof option.longitude === "number";
}

function canResolvePlaceMap(option: VotePlaceOptionDto) {
  return hasPlaceCoordinates(option) || Boolean(option.address?.trim() || option.label.trim());
}

function handleRowKeyDown(event: React.KeyboardEvent, action: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  action();
}

export function VoteSubmissionPage({
  vote,
  roomId,
  onClose,
  onVoted,
  onLocalVote,
  onLocalAddPlace,
  onLocalAddTime,
}: VoteSubmissionPageProps) {
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>(vote.myVote?.placeIds ?? []);
  const [selectedTimeIds, setSelectedTimeIds] = useState<string[]>(vote.myVote?.timeIds ?? []);
  const [placeOptions, setPlaceOptions] = useState<VotePlaceOptionDto[]>(vote.placeOptions);
  const [timeOptions, setTimeOptions] = useState<VoteTimeOptionDto[]>(vote.timeOptions);
  const [newPlaceLabel, setNewPlaceLabel] = useState("");
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [isPlaceSearchOpen, setIsPlaceSearchOpen] = useState(false);
  const [newTimeDate, setNewTimeDate] = useState("");
  const [newTimeValue, setNewTimeValue] = useState("");
  const [isAddingTime, setIsAddingTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mapTarget, setMapTarget] = useState<VotePlaceOptionDto | null>(null);
  const addingTimeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const canSubmit = selectedPlaceIds.length > 0 && selectedTimeIds.length > 0 && !submitting;

  const togglePlace = (id: string) => {
    setSelectedPlaceIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return vote.allowMultiple ? [...prev, id] : [id];
    });
  };

  const selectPlaceFromMap = (id: string) => {
    setSelectedPlaceIds((prev) => {
      if (prev.includes(id)) return prev;
      return vote.allowMultiple ? [...prev, id] : [id];
    });
  };

  const toggleTime = (id: string) => {
    setSelectedTimeIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return vote.allowMultiple ? [...prev, id] : [id];
    });
  };

  const handleAddPlace = async (place?: SelectedPlace) => {
    const label = (place?.name ?? newPlaceLabel).trim();
    if (!label) return;

    const res = await ChatService.chatControllerAddVoteOption(roomId, vote.id, {
      type: AddVoteOptionDto.type.PLACE,
      label,
      address: place?.address,
      mapLink: place?.mapUrl,
      latitude: place?.latitude,
      longitude: place?.longitude,
    });

    if (res.success && res.data) {
      setPlaceOptions(res.data.placeOptions);
      setTimeOptions(res.data.timeOptions);
    } else if (onLocalAddPlace) {
      const updated = onLocalAddPlace(label);
      setPlaceOptions(updated.placeOptions);
      setTimeOptions(updated.timeOptions);
    }

    setNewPlaceLabel("");
    setIsAddingPlace(false);
    setIsPlaceSearchOpen(false);
  };

  const handleAddTime = useCallback(async (date: string, time: string) => {
    if (!date || !time) return;
    const dateLabel = formatDateLabelFromInputs(date, time);
    if (!dateLabel) return;

    const res = await ChatService.chatControllerAddVoteOption(roomId, vote.id, {
      type: AddVoteOptionDto.type.TIME,
      dateLabel,
      date,
      time,
    });

    if (res.success && res.data) {
      setPlaceOptions(res.data.placeOptions);
      setTimeOptions(res.data.timeOptions);
    } else if (onLocalAddTime) {
      const updated = onLocalAddTime({ dateLabel, date, time });
      setPlaceOptions(updated.placeOptions);
      setTimeOptions(updated.timeOptions);
    }

    setNewTimeDate("");
    setNewTimeValue("");
    setIsAddingTime(false);
    addingTimeKeyRef.current = null;
  }, [onLocalAddTime, roomId, vote.id]);

  useEffect(() => {
    if (!isAddingTime || !newTimeDate || !newTimeValue) return;

    const timeKey = `${newTimeDate}-${newTimeValue}`;
    if (addingTimeKeyRef.current === timeKey) return;

    addingTimeKeyRef.current = timeKey;
    void handleAddTime(newTimeDate, newTimeValue);
  }, [handleAddTime, isAddingTime, newTimeDate, newTimeValue]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const payload: CastVoteDto = {
      placeIds: selectedPlaceIds,
      timeIds: selectedTimeIds,
    };

    const res = await ChatService.chatControllerCastVote(roomId, vote.id, payload);
    if (res.success && res.data) {
      onVoted(res.data);
      return;
    }

    if (onLocalVote) {
      const updated = onLocalVote(payload);
      onVoted(updated);
      return;
    }

    setSubmitting(false);
  };

  return (
    <PageRoot role="dialog" aria-modal="true" aria-labelledby="vote-submission-title">
      <TopNavigation>
        <BackButton type="button" onClick={onClose} aria-label="뒤로가기">
          <ChevronLeftIcon />
        </BackButton>
        <NavTitle id="vote-submission-title">투표</NavTitle>
        <NavCount>
          {vote.votedCount}/{vote.totalMembers} 투표
        </NavCount>
      </TopNavigation>

      <Body>
        <Section>
          <SectionHeader>
            <LocationIcon />
            <SectionTitle>만남 장소 투표</SectionTitle>
          </SectionHeader>
          <OptionList>
            {placeOptions.map((option) => {
              const checked = selectedPlaceIds.includes(option.id);
              const canOpenMap = canResolvePlaceMap(option);
              return (
                <OptionRow
                  key={option.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePlace(option.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => togglePlace(option.id))}
                  $checked={checked}
                >
                  <Radio $checked={checked}>{checked && <CheckIcon />}</Radio>
                  <OptionLabel $checked={checked}>{option.label}</OptionLabel>
                  <MapPinButton
                    type="button"
                    disabled={!canOpenMap}
                    aria-label={`${option.label} 지도 보기`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (canOpenMap) setMapTarget(option);
                    }}
                  >
                    <LocationIconSmall $muted={!canOpenMap} />
                  </MapPinButton>
                </OptionRow>
              );
            })}
            {isAddingPlace && (
              <NewInputRow>
                <NewPlaceField type="button" onClick={() => setIsPlaceSearchOpen(true)}>
                  <NewPlaceIcon>
                    <LocationIconSmall $muted />
                  </NewPlaceIcon>
                  <NewPlaceText>장소 선택</NewPlaceText>
                </NewPlaceField>
              </NewInputRow>
            )}
            <AddOptionButton type="button" onClick={() => setIsAddingPlace(true)}>
              <PlusIcon />
              새로운 장소 추가하기
            </AddOptionButton>
          </OptionList>
        </Section>

        <Section>
          <SectionHeader>
            <ClockIcon />
            <SectionTitle>만남 시간 투표</SectionTitle>
          </SectionHeader>
          <OptionList>
            {timeOptions.map((option) => {
              const checked = selectedTimeIds.includes(option.id);
              return (
                <OptionRow
                  key={option.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTime(option.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => toggleTime(option.id))}
                  $checked={checked}
                >
                  <Radio $checked={checked}>{checked && <CheckIcon />}</Radio>
                  <OptionLabel $checked={checked}>{option.dateLabel}</OptionLabel>
                </OptionRow>
              );
            })}
            {isAddingTime && (
              <NewTimeRow>
                <NewTimeFieldGroup>
                  <TimePickerField>
                    <CalendarIcon />
                    <HiddenDateInput
                      type="date"
                      value={newTimeDate}
                      onChange={(e) => setNewTimeDate(e.target.value)}
                    />
                    <PickerDisplay $empty={!newTimeDate}>{newTimeDate || "날짜 선택"}</PickerDisplay>
                  </TimePickerField>
                  <TimePickerField>
                    <ClockIconSmall />
                    <HiddenDateInput
                      type="time"
                      value={newTimeValue}
                      onChange={(e) => setNewTimeValue(e.target.value)}
                    />
                    <PickerDisplay $empty={!newTimeValue}>
                      {newTimeValue ? formatTimeLabel(newTimeValue) : "시간 선택"}
                    </PickerDisplay>
                  </TimePickerField>
                </NewTimeFieldGroup>
              </NewTimeRow>
            )}
            <AddOptionButton type="button" onClick={() => setIsAddingTime(true)}>
              <PlusIcon />
              새로운 시간 추가하기
            </AddOptionButton>
          </OptionList>
        </Section>
      </Body>

      <ActionArea>
        <PrimaryButton type="button" onClick={handleSubmit} disabled={!canSubmit} $active={canSubmit}>
          투표하기
        </PrimaryButton>
      </ActionArea>
      {mapTarget && (
        <PlaceMapPage
          place={mapTarget}
          onClose={() => setMapTarget(null)}
          onSelect={() => {
            selectPlaceFromMap(mapTarget.id);
            setMapTarget(null);
          }}
        />
      )}
      {isPlaceSearchOpen && (
        <PlaceSearchModal
          onClose={() => setIsPlaceSearchOpen(false)}
          onSelect={(place) => {
            void handleAddPlace(place);
          }}
        />
      )}
    </PageRoot>
  );
}
