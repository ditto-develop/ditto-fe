"use client";

/**
 * ⚠️ 보류 중(연결 안 됨) — 그룹 만남 투표 UI.
 *
 * 라이브 BE에 투표 계약이 없다(swagger·BE 위키 어디에도 없음).
 * 이 파일은 아직 구 백엔드 경로(`/api/chat/group-rooms/...`)를 호출하므로 그대로 노출하면
 * 라이브에서 404가 난다. `GROUP_VOTE_ENABLED`(features/chat/model/constants.ts)가 false인 동안
 * 화면에서 진입점이 막혀 있다. BE 엔드포인트가 생기면 externalApiFetch로 옮기고 플래그를 올린다.
 * 상세: INTEGRATION-TODO.md §A-2
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GroupVoteDto,
  VotePlaceOptionDto,
  VoteTimeOptionDto,
} from "@/shared/lib/api/generated";
import { AddVoteOptionDto, ChatService } from "@/shared/lib/api/generated";
import {
  ActionArea,
  ActionButton,
  AddOptionButton,
  BackButton,
  Body,
  BottomSpacer,
  CalendarIcon,
  ChevronLeft,
  ClockIcon,
  ClockIconSmall,
  HiddenDateInput,
  InlineCheckIcon,
  LocationIcon,
  NavTitle,
  NewInputRow,
  NewPlaceField,
  NewPlaceIcon,
  NewPlaceText,
  NewTimeFieldGroup,
  NewTimeRow,
  OptionCard,
  OptionHeader,
  OptionLabel,
  OptionLabelRow,
  OptionList,
  Overlay,
  PickerDisplay,
  PlusIcon,
  ProgressFill,
  ProgressTrack,
  Section,
  SectionHeader,
  SectionHeaderWrapper,
  SectionIcon,
  SectionSubtext,
  SectionTitle,
  TimePickerField,
  TopNav,
  VoteCount,
  VoteCounter,
  VotersLine,
} from "./_parts/VoteResultsPage.parts";
import { PlaceMapPage } from "./PlaceMapPage";
import { PlaceSearchModal } from "./PlaceSearchModal";
import type { SelectedPlace } from "./PlaceSearchModal";

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

interface VoteResultsPageProps {
  vote: GroupVoteDto;
  memberMap: Record<string, string>;
  roomId: string;
  onClose: () => void;
  onRevote: () => void;
  onVoteUpdated?: (updatedVote: GroupVoteDto) => void;
}

export function VoteResultsPage({
  vote,
  memberMap,
  roomId,
  onClose,
  onRevote,
  onVoteUpdated,
}: VoteResultsPageProps) {
  const [placeOptions, setPlaceOptions] = useState<VotePlaceOptionDto[]>(vote.placeOptions);
  const [timeOptions, setTimeOptions] = useState<VoteTimeOptionDto[]>(vote.timeOptions);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [newPlaceLabel, setNewPlaceLabel] = useState("");
  const [isAddingTime, setIsAddingTime] = useState(false);
  const [newTimeDate, setNewTimeDate] = useState("");
  const [newTimeValue, setNewTimeValue] = useState("");
  const [mapTarget, setMapTarget] = useState<VotePlaceOptionDto | null>(null);
  const [isPlaceSearchOpen, setIsPlaceSearchOpen] = useState(false);
  const addingTimeKeyRef = useRef<string | null>(null);

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
  const canAddOptions = !hasMyVote && isOpen && !isAllVoted;
  const totalMembers = vote.totalMembers;

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
      onVoteUpdated?.(res.data);
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
      onVoteUpdated?.(res.data);
    }
    setNewTimeDate("");
    setNewTimeValue("");
    setIsAddingTime(false);
    addingTimeKeyRef.current = null;
  }, [onVoteUpdated, roomId, vote.id]);

  useEffect(() => {
    if (!isAddingTime || !newTimeDate || !newTimeValue) return;

    const timeKey = `${newTimeDate}-${newTimeValue}`;
    if (addingTimeKeyRef.current === timeKey) return;

    addingTimeKeyRef.current = timeKey;
    void handleAddTime(newTimeDate, newTimeValue);
  }, [handleAddTime, isAddingTime, newTimeDate, newTimeValue]);

  const renderVoters = (voterIds: string[]) => {
    if (!voterIds.length) return null;
    const names = voterIds
      .map((id) => memberMap[id] ?? "익명")
      .join(", ");
    return <VotersLine>{names}</VotersLine>;
  };

  const renderPlaceOption = (option: VotePlaceOptionDto) => {
    const voteCount = option.voterIds.length;
    const isWinner = voteCount > 0 && voteCount === maxPlaceVotes;
    const hasVotes = voteCount > 0;
    const isMine = myPlaceIds.has(option.id);
    const progressPct = totalMembers > 0 ? (voteCount / totalMembers) * 100 : 0;
    const canOpenMap = canResolvePlaceMap(option);

    return (
      <OptionCard
        key={option.id}
        $isWinner={isWinner}
        $hasVotes={hasVotes}
        $isAllVoted={isAllVoted}
        $clickable={canOpenMap}
        type="button"
        onClick={() => {
          if (canOpenMap) setMapTarget(option);
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
        <ProgressTrack>
          <ProgressFill style={{ width: `${progressPct}%` }} />
        </ProgressTrack>
      </OptionCard>
    );
  };

  const renderTimeOption = (option: VoteTimeOptionDto) => {
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
        $clickable={false}
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
        <ProgressTrack>
          <ProgressFill style={{ width: `${progressPct}%` }} />
        </ProgressTrack>
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
              <>
                {canAddOptions && isAddingPlace && (
                <NewInputRow>
                  <NewPlaceField type="button" onClick={() => setIsPlaceSearchOpen(true)}>
                    <NewPlaceIcon>
                      <LocationIcon />
                    </NewPlaceIcon>
                    <NewPlaceText>장소 선택</NewPlaceText>
                  </NewPlaceField>
                </NewInputRow>
                )}
                <AddOptionButton
                  type="button"
                  disabled={!canAddOptions}
                  $disabled={!canAddOptions}
                  onClick={() => {
                    if (canAddOptions) setIsAddingPlace(true);
                  }}
                >
                  <PlusIcon />
                  새로운 장소 추가하기
                </AddOptionButton>
              </>
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
              <>
                {canAddOptions && isAddingTime && (
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
                <AddOptionButton
                  type="button"
                  disabled={!canAddOptions}
                  $disabled={!canAddOptions}
                  onClick={() => {
                    if (canAddOptions) setIsAddingTime(true);
                  }}
                >
                  <PlusIcon />
                  새로운 시간 추가하기
                </AddOptionButton>
              </>
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
      {mapTarget && (
        <PlaceMapPage
          place={mapTarget}
          onClose={() => setMapTarget(null)}
          onSelect={() => setMapTarget(null)}
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
    </Overlay>
  );
}
