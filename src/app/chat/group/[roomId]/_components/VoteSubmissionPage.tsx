"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { formatMeetAt } from "@/features/chat";
import type { CastVoteRequest, GroupVote, VotePlaceOption } from "@/features/chat";
import {
  ActionArea,
  BackButton,
  Body,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  LocationIcon,
  LocationIconSmall,
  MapPinButton,
  NavCount,
  NavTitle,
  OptionLabel,
  OptionList,
  OptionRow,
  PageRoot,
  PrimaryButton,
  Radio,
  Section,
  SectionHeader,
  SectionTitle,
  SubmitError,
  TopNavigation,
  AddTimeRow,
} from "./_parts/VoteSubmissionPage.parts";
// 선택지 추가 UI는 생성 모달과 같은 부품을 쓴다 — 두 화면이 같은 행 모양을 그린다.
import {
  AddOptionButton,
  CalendarIcon,
  PlusIcon,
} from "./_parts/GroupVoteCreateModal.parts";
import { useBackClose } from "@/shared/hooks/useBackClose";
import { PlaceMapPage } from "./PlaceMapPage";
import { PlaceSearchModal } from "./PlaceSearchModal";
import {
  formatDateLabel,
  formatTimeLabel,
  MAX_OPTION_COUNT,
  NativePickerField,
} from "./_parts/VoteOptionPicker";
import type { AddOptionInput } from "@/features/chat/hooks/useGroupVote";
import { toMeetAt } from "@/features/chat";

interface VoteSubmissionPageProps {
  vote: GroupVote;
  onClose: () => void;
  /**
   * cast 요청. **보낸 집합이 최종 선택으로 치환**되므로 유지할 기존 선택도 함께 담는다
   * (화면 상태가 이미 기존 선택으로 초기화돼 있어 그대로 보내면 된다).
   */
  onSubmit: (body: CastVoteRequest) => Promise<void>;
  /**
   * 진행 중 투표에 선택지 하나 추가. 상한(타입당 10개)·중복은 서버가 판정하므로
   * 화면은 실패 메시지를 그대로 보여주기만 한다.
   */
  onAddOption: (option: AddOptionInput) => Promise<void>;
}

function hasPlaceCoordinates(option: VotePlaceOption) {
  return typeof option.latitude === "number" && typeof option.longitude === "number";
}

/** 좌표가 없어도 주소·상호명이 있으면 지도에서 검색으로 찾을 수 있다. */
function canResolvePlaceMap(option: VotePlaceOption) {
  return hasPlaceCoordinates(option) || Boolean(option.address?.trim() || option.label.trim());
}

function handleRowKeyDown(event: React.KeyboardEvent, action: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  action();
}

/**
 * 만남 투표 제출 화면.
 *
 * 선택지는 **생성 시 확정**되어 여기서 추가·삭제할 수 없다(선택지 추가 API는 만들지 않기로
 * 확정 — BE 위키 Frontend-Vote-Guide). 재투표도 같은 화면에서 같은 요청을 다시 보낸다.
 */
export function VoteSubmissionPage({ vote, onClose, onSubmit, onAddOption }: VoteSubmissionPageProps) {
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<number[]>(vote.myVote?.placeIds ?? []);
  const [selectedTimeIds, setSelectedTimeIds] = useState<number[]>(vote.myVote?.timeIds ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * 라우트가 아니라 화면 안의 상태로 떠 있는 전체화면이라 OS 뒤로가기에 직접 등록한다.
   * 등록하지 않으면 뒤로가기가 채팅방 문서째로 걷어내 홈으로 나간다
   * (`shared/lib/native/appShell.ts` 의 backButton 처리 순서). 지도 오버레이가 이 위에
   * 겹쳐 있으면 나중에 등록된 지도가 먼저 닫힌다 — 스택의 맨 위 하나만 소비된다.
   */
  useBackClose(true, onClose);

  const [mapTarget, setMapTarget] = useState<VotePlaceOption | null>(null);

  // 선택지 추가. 장소는 검색 모달로, 시간은 행 안의 날짜·시간 피커로 받는다.
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [addingOption, setAddingOption] = useState(false);

  const canAddPlace = vote.placeOptions.length < MAX_OPTION_COUNT;
  const canAddTime = vote.timeOptions.length < MAX_OPTION_COUNT;

  /** 추가 실패는 투표 제출 에러와 같은 자리에 보여 준다 — 화면에 에러 슬롯이 하나뿐이다. */
  const runAddOption = async (option: AddOptionInput) => {
    if (addingOption) return;
    setAddingOption(true);
    setError(null);
    try {
      await onAddOption(option);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "선택지를 추가하지 못했어요.");
    } finally {
      setAddingOption(false);
    }
  };

  const handleAddTime = async () => {
    if (!newDate || !newTime) return;
    await runAddOption({ type: "time", time: { meetAt: toMeetAt(newDate, newTime) } });
    setNewDate("");
    setNewTime("");
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const canSubmit = selectedPlaceIds.length > 0 && selectedTimeIds.length > 0 && !submitting;

  /** allowMultiple이 false면 유형별 1개까지다 — 넘기면 서버가 8207로 거절한다. */
  const toggleId = (
    setSelected: React.Dispatch<React.SetStateAction<number[]>>,
    optionId: number,
  ) => {
    setSelected((previous) => {
      if (previous.includes(optionId)) return previous.filter((id) => id !== optionId);
      return vote.allowMultiple ? [...previous, optionId] : [optionId];
    });
  };

  const selectPlaceFromMap = (optionId: number) => {
    setSelectedPlaceIds((previous) => {
      if (previous.includes(optionId)) return previous;
      return vote.allowMultiple ? [...previous, optionId] : [optionId];
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ placeIds: selectedPlaceIds, timeIds: selectedTimeIds });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "투표하지 못했어요. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
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
            {vote.placeOptions.map((option) => {
              const checked = selectedPlaceIds.includes(option.optionId);
              const canOpenMap = canResolvePlaceMap(option);
              return (
                <OptionRow
                  key={option.optionId}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleId(setSelectedPlaceIds, option.optionId)}
                  onKeyDown={(event) =>
                    handleRowKeyDown(event, () => toggleId(setSelectedPlaceIds, option.optionId))
                  }
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

            {canAddPlace && (
              <AddOptionButton
                type="button"
                disabled={addingOption}
                onClick={() => setPlaceSearchOpen(true)}
              >
                <PlusIcon aria-hidden="true" />
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
            {vote.timeOptions.map((option) => {
              const checked = selectedTimeIds.includes(option.optionId);
              return (
                <OptionRow
                  key={option.optionId}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleId(setSelectedTimeIds, option.optionId)}
                  onKeyDown={(event) =>
                    handleRowKeyDown(event, () => toggleId(setSelectedTimeIds, option.optionId))
                  }
                  $checked={checked}
                >
                  <Radio $checked={checked}>{checked && <CheckIcon />}</Radio>
                  {/* 서버는 표시 문구를 저장하지 않는다 — meetAt을 FE가 읽는다. */}
                  <OptionLabel $checked={checked}>{formatMeetAt(option.meetAt)}</OptionLabel>
                </OptionRow>
              );
            })}

            {canAddTime && (
              <AddTimeRow>
                <NativePickerField
                  type="date"
                  value={newDate}
                  label={formatDateLabel(newDate)}
                  isPlaceholder={!newDate}
                  icon={<CalendarIcon aria-hidden="true" />}
                  ariaLabel="추가할 시간 옵션 날짜"
                  onChange={setNewDate}
                />
                <NativePickerField
                  type="time"
                  value={newTime}
                  label={formatTimeLabel(newTime)}
                  isPlaceholder={!newTime}
                  subtle
                  icon={<ClockIcon aria-hidden="true" />}
                  ariaLabel="추가할 시간 옵션 시간"
                  onChange={setNewTime}
                />
                <AddOptionButton
                  type="button"
                  disabled={!newDate || !newTime || addingOption}
                  onClick={handleAddTime}
                >
                  <PlusIcon aria-hidden="true" />
                  새로운 시간 추가하기
                </AddOptionButton>
              </AddTimeRow>
            )}
          </OptionList>
        </Section>
      </Body>

      <ActionArea>
        {error && <SubmitError role="alert">{error}</SubmitError>}
        <PrimaryButton type="button" onClick={handleSubmit} disabled={!canSubmit} $active={canSubmit}>
          {submitting ? "투표 중..." : "투표하기"}
        </PrimaryButton>
      </ActionArea>

      {placeSearchOpen && (
        <PlaceSearchModal
          onClose={() => setPlaceSearchOpen(false)}
          onSelect={(place) => {
            setPlaceSearchOpen(false);
            void runAddOption({
              type: "place",
              // 검색 결과만 주소·좌표를 갖는다. 생성 때와 같이 빈 값은 아예 싣지 않는다.
              place: {
                label: place.name,
                ...(place.address ? { address: place.address } : {}),
                ...(place.mapUrl ? { mapLink: place.mapUrl } : {}),
                ...(typeof place.latitude === "number" ? { latitude: place.latitude } : {}),
                ...(typeof place.longitude === "number" ? { longitude: place.longitude } : {}),
              },
            });
          }}
        />
      )}

      {mapTarget && (
        <PlaceMapPage
          place={mapTarget}
          onClose={() => setMapTarget(null)}
          onSelect={() => {
            selectPlaceFromMap(mapTarget.optionId);
            setMapTarget(null);
          }}
        />
      )}
    </PageRoot>
  );
}
