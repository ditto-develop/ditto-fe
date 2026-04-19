"use client";

import { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import type {
  GroupVote,
  VotePlaceOption,
  VoteTimeOption,
} from "@/lib/api/services/GroupChatService";
import { GroupChatService } from "@/lib/api/services/GroupChatService";

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

interface VoteResultsPageProps {
  vote: GroupVote;
  memberMap: Record<string, string>;
  roomId: string;
  onClose: () => void;
  onRevote: () => void;
  onVoteUpdated?: (updatedVote: GroupVote) => void;
}

export function VoteResultsPage({
  vote,
  memberMap,
  roomId,
  onClose,
  onRevote,
  onVoteUpdated,
}: VoteResultsPageProps) {
  const [placeOptions, setPlaceOptions] = useState<VotePlaceOption[]>(vote.placeOptions);
  const [timeOptions, setTimeOptions] = useState<VoteTimeOption[]>(vote.timeOptions);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [newPlaceLabel, setNewPlaceLabel] = useState("");
  const [isAddingTime, setIsAddingTime] = useState(false);
  const [newTimeDate, setNewTimeDate] = useState("");
  const [newTimeValue, setNewTimeValue] = useState("");

  useEffect(() => {
    setPlaceOptions(vote.placeOptions);
    setTimeOptions(vote.timeOptions);
  }, [vote.placeOptions, vote.timeOptions]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const myPlaceIds = new Set(vote.myVote?.placeIds ?? []);
  const myTimeIds = new Set(vote.myVote?.timeIds ?? []);
  const maxPlaceVotes = Math.max(0, ...placeOptions.map((o) => o.voterIds.length));
  const maxTimeVotes = Math.max(0, ...timeOptions.map((o) => o.voterIds.length));

  const isOpen = vote.status === "OPEN";
  const hasMyVote = vote.myVote !== null;
  const isAllVoted = vote.votedCount >= vote.totalMembers;
  const showRevote = isOpen && hasMyVote && !isAllVoted;
  const showAddOptions = isOpen && !isAllVoted;
  const totalMembers = vote.totalMembers;

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
      onVoteUpdated?.(res.data);
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
      onVoteUpdated?.(res.data);
    }
    setNewTimeDate("");
    setNewTimeValue("");
    setIsAddingTime(false);
  };

  const renderVoters = (voterIds: string[]) => {
    if (!voterIds.length) return null;
    const names = voterIds
      .map((id) => memberMap[id] ?? "익명")
      .join(", ");
    return <VotersLine>{names}</VotersLine>;
  };

  const renderPlaceOption = (option: VotePlaceOption) => {
    const voteCount = option.voterIds.length;
    const isWinner = voteCount > 0 && voteCount === maxPlaceVotes;
    const hasVotes = voteCount > 0;
    const isMine = myPlaceIds.has(option.id);
    const progressPct = totalMembers > 0 ? (voteCount / totalMembers) * 100 : 0;

    return (
      <OptionCard
        key={option.id}
        $isWinner={isWinner}
        $hasVotes={hasVotes}
        $isAllVoted={isAllVoted}
        type="button"
        onClick={() => {
          if (option.mapLink) window.open(option.mapLink, "_blank", "noopener");
        }}
      >
        <OptionHeader>
          <OptionLabelRow>
            <OptionLabel>{option.label}</OptionLabel>
            {isMine && <InlineCheckIcon />}
          </OptionLabelRow>
          {hasVotes && <VoteCount>{voteCount}명</VoteCount>}
        </OptionHeader>
        {hasVotes && renderVoters(option.voterIds)}
        {hasVotes && (
          <ProgressTrack>
            <ProgressFill style={{ width: `${progressPct}%` }} />
          </ProgressTrack>
        )}
      </OptionCard>
    );
  };

  const renderTimeOption = (option: VoteTimeOption) => {
    const voteCount = option.voterIds.length;
    const isWinner = voteCount > 0 && voteCount === maxTimeVotes;
    const hasVotes = voteCount > 0;
    const isMine = myTimeIds.has(option.id);
    const progressPct = totalMembers > 0 ? (voteCount / totalMembers) * 100 : 0;

    return (
      <OptionCard
        key={option.id}
        $isWinner={isWinner}
        $hasVotes={hasVotes}
        $isAllVoted={isAllVoted}
        as="div"
      >
        <OptionHeader>
          <OptionLabelRow>
            <OptionLabel>{option.dateLabel}</OptionLabel>
            {isMine && <InlineCheckIcon />}
          </OptionLabelRow>
          {hasVotes && <VoteCount>{voteCount}명</VoteCount>}
        </OptionHeader>
        {hasVotes && renderVoters(option.voterIds)}
        {hasVotes && (
          <ProgressTrack>
            <ProgressFill style={{ width: `${progressPct}%` }} />
          </ProgressTrack>
        )}
      </OptionCard>
    );
  };

  return (
    <Overlay role="dialog" aria-modal="true">
      <TopNav>
        <BackButton type="button" onClick={onClose} aria-label="뒤로가기">
          <ChevronLeft />
        </BackButton>
        <NavTitle>투표</NavTitle>
        <VoteCounter>
          {vote.votedCount}/{vote.totalMembers} 투표
        </VoteCounter>
      </TopNav>

      <Body>
        <Section>
          <SectionHeaderWrapper>
            <SectionHeader>
              <SectionIcon>
                <LocationIcon />
              </SectionIcon>
              <SectionTitle>만남 장소 투표</SectionTitle>
            </SectionHeader>
            <SectionSubtext>장소를 탭하고 위치를 확인해 보세요</SectionSubtext>
          </SectionHeaderWrapper>
          <OptionList>
            {placeOptions.map(renderPlaceOption)}
            {showAddOptions && (
              isAddingPlace ? (
                <NewInputRow>
                  <NewInput
                    value={newPlaceLabel}
                    onChange={(e) => setNewPlaceLabel(e.target.value)}
                    placeholder="장소 이름"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPlace();
                    }}
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
              )
            )}
          </OptionList>
        </Section>

        <Section>
          <SectionHeaderWrapper>
            <SectionHeader>
              <SectionIcon>
                <ClockIcon />
              </SectionIcon>
              <SectionTitle>만남 시간 투표</SectionTitle>
            </SectionHeader>
          </SectionHeaderWrapper>
          <OptionList>
            {timeOptions.map(renderTimeOption)}
            {showAddOptions && (
              isAddingTime ? (
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
              )
            )}
          </OptionList>
        </Section>
        <BottomSpacer />
      </Body>

      {showRevote && (
        <ActionArea>
          <ActionButton type="button" onClick={onRevote}>
            다시 투표하기
          </ActionButton>
        </ActionArea>
      )}
    </Overlay>
  );
}

/* ── SVG Icons ── */

function ChevronLeft() {
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

function LocationIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon() {
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

function InlineCheckIcon() {
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

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 3.8V7.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ClockIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ── Styled Components ── */

const fontBase = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
`;

const TopNav = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  flex-shrink: 0;
  background-color: var(--color-semantic-background-normal-normal);
`;

const BackButton = styled.button`
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

const NavTitle = styled.h1`
  ${fontBase}
  flex: 1;
  margin: 0;
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  text-align: center;
  color: var(--color-semantic-label-strong);
`;

const VoteCounter = styled.span`
  ${fontBase}
  font-size: var(--typography-headline-2-font-size);
  font-weight: 400;
  line-height: 1.412;
  color: var(--color-semantic-label-alternative);
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-semantic-label-normal);
`;

const SectionIcon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.h2`
  ${fontBase}
  margin: 0;
  font-size: var(--typography-headline-1-font-size);
  font-weight: 600;
  line-height: 1.445;
  letter-spacing: -0.004px;
  color: var(--color-semantic-label-normal);
`;

const SectionSubtext = styled.p`
  ${fontBase}
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 400;
  line-height: 1.429;
  letter-spacing: 0.203px;
  color: var(--color-semantic-label-normal);
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OptionCard = styled.button<{
  $isWinner: boolean;
  $hasVotes: boolean;
  $isAllVoted: boolean;
}>`
  ${fontBase}
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
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
            border: 1px solid var(--color-semantic-primary-normal);
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

  &:active {
    opacity: 0.78;
  }
`;

const OptionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
`;

const OptionLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--color-semantic-label-normal);
`;

const OptionLabel = styled.span`
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

const VoteCount = styled.span`
  ${fontBase}
  flex-shrink: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: 400;
  line-height: 1.385;
  letter-spacing: 0.252px;
  color: var(--color-semantic-label-alternative);
`;

const VotersLine = styled.p`
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

const ProgressTrack = styled.div`
  position: relative;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background-color: var(--color-semantic-fill-normal);
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 2px;
  background-color: var(--color-semantic-primary-normal);
  transition: width 0.3s ease;
`;

const BottomSpacer = styled.div`
  height: 24px;
  flex-shrink: 0;
`;

const ActionArea = styled.div`
  flex-shrink: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
  background-color: var(--color-semantic-background-normal-normal);
`;

const ActionButton = styled.button`
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

const AddOptionButton = styled.button`
  ${fontBase}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 12px;
  border: 1px solid
    var(--color-semantic-line-normal-neutral);
  border-radius: 12px;
  background: transparent;
  color: var(--color-semantic-label-alternative);
  cursor: pointer;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.091px;
`;

const NewInputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid
    var(--color-semantic-line-normal-neutral);
`;

const NewTimeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid
    var(--color-semantic-line-normal-neutral);
`;

const NewInput = styled.input`
  ${fontBase}
  width: 100%;
  padding: 8px 10px;
  border: 1px solid
    var(--color-semantic-line-normal-neutral);
  border-radius: 8px;
  background: transparent;
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  outline: none;
  box-sizing: border-box;

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
  border: 1px solid
    var(--color-semantic-line-normal-neutral);
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
  ${fontBase}
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
  ${fontBase}
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
