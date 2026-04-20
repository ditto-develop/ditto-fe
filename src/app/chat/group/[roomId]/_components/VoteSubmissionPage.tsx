"use client";

import { useEffect, useState } from "react";
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
  LocationBadge,
  LocationIcon,
  LocationIconSmall,
  NavCount,
  NavTitle,
  NewInput,
  NewInputActions,
  NewInputRow,
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
  TextButton,
  TimePickerField,
  TopNavigation,
} from "./_parts/VoteSubmissionPage.parts";

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
  const [newTimeDate, setNewTimeDate] = useState("");
  const [newTimeValue, setNewTimeValue] = useState("");
  const [isAddingTime, setIsAddingTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const toggleTime = (id: string) => {
    setSelectedTimeIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return vote.allowMultiple ? [...prev, id] : [id];
    });
  };

  const handleAddPlace = async () => {
    const label = newPlaceLabel.trim();
    if (!label) return;

    const res = await ChatService.chatControllerAddVoteOption(roomId, vote.id, {
      type: AddVoteOptionDto.type.PLACE,
      label,
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
  };

  const handleAddTime = async () => {
    if (!newTimeDate || !newTimeValue) return;
    const dateLabel = formatDateLabelFromInputs(newTimeDate, newTimeValue);
    if (!dateLabel) return;

    const res = await ChatService.chatControllerAddVoteOption(roomId, vote.id, {
      type: AddVoteOptionDto.type.TIME,
      dateLabel,
      date: newTimeDate,
      time: newTimeValue,
    });

    if (res.success && res.data) {
      setPlaceOptions(res.data.placeOptions);
      setTimeOptions(res.data.timeOptions);
    } else if (onLocalAddTime) {
      const updated = onLocalAddTime({ dateLabel, date: newTimeDate, time: newTimeValue });
      setPlaceOptions(updated.placeOptions);
      setTimeOptions(updated.timeOptions);
    }

    setNewTimeDate("");
    setNewTimeValue("");
    setIsAddingTime(false);
  };

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
              return (
                <OptionRow
                  key={option.id}
                  type="button"
                  onClick={() => togglePlace(option.id)}
                  $checked={checked}
                >
                  <Radio $checked={checked}>{checked && <CheckIcon />}</Radio>
                  <OptionLabel $checked={checked}>{option.label}</OptionLabel>
                  <LocationBadge>
                    <LocationIconSmall $muted={!option.mapLink} />
                  </LocationBadge>
                </OptionRow>
              );
            })}
            {isAddingPlace ? (
              <NewInputRow>
                <NewInput
                  value={newPlaceLabel}
                  onChange={(e) => setNewPlaceLabel(e.target.value)}
                  placeholder="장소 이름"
                  autoFocus
                />
                <NewInputActions>
                  <TextButton type="button" onClick={() => { setIsAddingPlace(false); setNewPlaceLabel(""); }}>
                    취소
                  </TextButton>
                  <TextButton type="button" $primary onClick={handleAddPlace}>
                    추가
                  </TextButton>
                </NewInputActions>
              </NewInputRow>
            ) : (
              <AddOptionButton type="button" onClick={() => setIsAddingPlace(true)}>
                <PlusIcon />
                새로운 장소 추가하기
              </AddOptionButton>
            )}
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
                  type="button"
                  onClick={() => toggleTime(option.id)}
                  $checked={checked}
                >
                  <Radio $checked={checked}>{checked && <CheckIcon />}</Radio>
                  <OptionLabel $checked={checked}>{option.dateLabel}</OptionLabel>
                </OptionRow>
              );
            })}
            {isAddingTime ? (
              <NewTimeRow>
                <TimePickerField>
                  <CalendarIcon />
                  <HiddenDateInput
                    type="date"
                    value={newTimeDate}
                    onChange={(e) => setNewTimeDate(e.target.value)}
                  />
                  <PickerDisplay>{newTimeDate || "날짜 선택"}</PickerDisplay>
                </TimePickerField>
                <TimePickerField>
                  <ClockIconSmall />
                  <HiddenDateInput
                    type="time"
                    value={newTimeValue}
                    onChange={(e) => setNewTimeValue(e.target.value)}
                  />
                  <PickerDisplay>{newTimeValue ? formatTimeLabel(newTimeValue) : "시간 선택"}</PickerDisplay>
                </TimePickerField>
                <NewInputActions>
                  <TextButton type="button" onClick={() => { setIsAddingTime(false); setNewTimeDate(""); setNewTimeValue(""); }}>
                    취소
                  </TextButton>
                  <TextButton type="button" $primary onClick={handleAddTime}>
                    추가
                  </TextButton>
                </NewInputActions>
              </NewTimeRow>
            ) : (
              <AddOptionButton type="button" onClick={() => setIsAddingTime(true)}>
                <PlusIcon />
                새로운 시간 추가하기
              </AddOptionButton>
            )}
          </OptionList>
        </Section>
      </Body>

      <ActionArea>
        <PrimaryButton type="button" onClick={handleSubmit} disabled={!canSubmit} $active={canSubmit}>
          투표하기
        </PrimaryButton>
      </ActionArea>
    </PageRoot>
  );
}
