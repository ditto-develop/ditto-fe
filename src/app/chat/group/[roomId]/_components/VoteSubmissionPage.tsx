"use client";

import { useEffect, useState } from "react";
import type React from "react";
import styled, { css } from "styled-components";
import type {
  CastGroupVotePayload,
  GroupVote,
  VotePlaceOption,
  VoteTimeOption,
} from "@/lib/api/services/GroupChatService";
import { GroupChatService } from "@/lib/api/services/GroupChatService";

interface VoteSubmissionPageProps {
  vote: GroupVote;
  roomId: string;
  onClose: () => void;
  onVoted: (updatedVote: GroupVote) => void;
  /** 실패/모킹 시 fallback — page client가 로컬 상태 업데이트를 처리 */
  onLocalVote?: (payload: CastGroupVotePayload) => GroupVote;
  onLocalAddPlace?: (label: string) => GroupVote;
  onLocalAddTime?: (draft: { dateLabel: string; date: string; time: string }) => GroupVote;
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
  const [placeOptions, setPlaceOptions] = useState<VotePlaceOption[]>(vote.placeOptions);
  const [timeOptions, setTimeOptions] = useState<VoteTimeOption[]>(vote.timeOptions);
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

    const res = await GroupChatService.addGroupVoteOption(roomId, vote.id, {
      type: "PLACE",
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

    const res = await GroupChatService.addGroupVoteOption(roomId, vote.id, {
      type: "TIME",
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
    const payload: CastGroupVotePayload = {
      placeIds: selectedPlaceIds,
      timeIds: selectedTimeIds,
    };

    const res = await GroupChatService.castGroupVote(roomId, vote.id, payload);
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

const textStyle = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

const PageRoot = styled.div`
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
  gap: 16px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  flex-shrink: 0;
`;

const BackButton = styled.button`
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

const NavTitle = styled.h2`
  ${textStyle};
  flex: 1;
  margin: 0;
  color: var(--color-semantic-label-strong);
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  text-align: center;
`;

const NavCount = styled.span`
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

const Body = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 16px 104px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
`;

const SectionTitle = styled.h3`
  ${textStyle};
  flex: 1;
  margin: 0;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-headline-1-font-size);
  font-weight: 600;
  line-height: 1.445;
  letter-spacing: -0.018px;
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OptionRow = styled.button<{ $checked: boolean }>`
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

const OptionLabel = styled.span<{ $checked: boolean }>`
  ${textStyle};
  flex: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
`;

const Radio = styled.span<{ $checked: boolean }>`
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

const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background-color: var(--color-semantic-fill-normal);
`;

const AddOptionButton = styled.button`
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

const NewInputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--color-semantic-static-white);
  border: 1px solid var(--color-semantic-line-normal-neutral);
`;

const NewTimeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--color-semantic-static-white);
  border: 1px solid var(--color-semantic-line-normal-neutral);
`;

const NewInput = styled.input`
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

const TimePickerField = styled.label`
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

const HiddenDateInput = styled.input`
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

const PickerDisplay = styled.span`
  ${textStyle};
  flex: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  color: var(--color-semantic-label-normal);
`;

const NewInputActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`;

const TextButton = styled.button<{ $primary?: boolean }>`
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

const IconSvg = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
`;

const IconSvgSmall = styled.svg`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

function ChevronLeftIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvg>
  );
}

function LocationIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
    </IconSvg>
  );
}

function LocationIconSmall({ $muted }: { $muted?: boolean }) {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: $muted ? "var(--color-semantic-label-assistive)" : "var(--color-semantic-label-normal)" }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
    </IconSvgSmall>
  );
}

function ClockIcon() {
  return (
    <IconSvg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvg>
  );
}

function ClockIconSmall() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--color-semantic-label-normal)" }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvgSmall>
  );
}

function CalendarIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconSvgSmall>
  );
}

function PlusIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconSvgSmall>
  );
}

function CheckIcon() {
  return (
    <IconSvgSmall viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 12, height: 12 }}>
      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </IconSvgSmall>
  );
}
