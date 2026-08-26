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
} from "./_parts/VoteSubmissionPage.parts";
import { PlaceMapPage } from "./PlaceMapPage";

interface VoteSubmissionPageProps {
  vote: GroupVote;
  onClose: () => void;
  /**
   * cast 요청. **보낸 집합이 최종 선택으로 치환**되므로 유지할 기존 선택도 함께 담는다
   * (화면 상태가 이미 기존 선택으로 초기화돼 있어 그대로 보내면 된다).
   */
  onSubmit: (body: CastVoteRequest) => Promise<void>;
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
export function VoteSubmissionPage({ vote, onClose, onSubmit }: VoteSubmissionPageProps) {
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<number[]>(vote.myVote?.placeIds ?? []);
  const [selectedTimeIds, setSelectedTimeIds] = useState<number[]>(vote.myVote?.timeIds ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapTarget, setMapTarget] = useState<VotePlaceOption | null>(null);

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
          </OptionList>
        </Section>
      </Body>

      <ActionArea>
        {error && <SubmitError role="alert">{error}</SubmitError>}
        <PrimaryButton type="button" onClick={handleSubmit} disabled={!canSubmit} $active={canSubmit}>
          {submitting ? "투표 중..." : "투표하기"}
        </PrimaryButton>
      </ActionArea>

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
