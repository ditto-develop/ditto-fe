"use client";

import { useEffect, useState } from "react";
import { formatMeetAt, isTied, tallyPlaceOptions, tallyTimeOptions } from "@/features/chat";
import type { GroupVote, VotePlaceOption, VoteTally, VoteTimeOption } from "@/features/chat";
import {
  ActionArea,
  ActionButton,
  BackButton,
  Body,
  BottomSpacer,
  ChevronLeft,
  ClockIcon,
  InlineCheckIcon,
  LocationIcon,
  NavTitle,
  OptionCard,
  OptionHeader,
  OptionLabel,
  OptionLabelRow,
  OptionList,
  Overlay,
  ProgressFill,
  ProgressTrack,
  Section,
  SectionHeader,
  SectionHeaderWrapper,
  SectionIcon,
  SectionSubtext,
  SectionTitle,
  TopNav,
  VoteCount,
  VoteCounter,
  VotersLine,
} from "./_parts/VoteResultsPage.parts";
import { PlaceMapPage } from "./PlaceMapPage";

interface VoteResultsPageProps {
  vote: GroupVote;
  /** voterIds(회원 ID) → 표시 이름. 서버는 ID만 주므로 매핑은 화면 몫이다. */
  memberNameById: Map<number, string>;
  onClose: () => void;
  onRevote: () => void;
  /** 마감. 방 멤버 누구나 가능하고 멱등이라 중복 호출을 막을 필요가 없다. */
  onCloseVote: () => Promise<void>;
}

function hasPlaceCoordinates(option: VotePlaceOption) {
  return typeof option.latitude === "number" && typeof option.longitude === "number";
}

function canResolvePlaceMap(option: VotePlaceOption) {
  return hasPlaceCoordinates(option) || Boolean(option.address?.trim() || option.label.trim());
}

/**
 * 만남 투표 결과 화면.
 *
 * **서버는 승자·득표율을 계산하지 않는다.** 1위·동표 판정은 전부 `tally*` 헬퍼가 하고,
 * 선택지 배열 순서(=생성 시 입력 순)를 그대로 노출한다. 동표는 동표로 끝난다 —
 * 재투표·확정 절차는 기획에 없다.
 */
export function VoteResultsPage({
  vote,
  memberNameById,
  onClose,
  onRevote,
  onCloseVote,
}: VoteResultsPageProps) {
  const [mapTarget, setMapTarget] = useState<VotePlaceOption | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const myPlaceIds = new Set(vote.myVote?.placeIds ?? []);
  const myTimeIds = new Set(vote.myVote?.timeIds ?? []);
  const placeTallies = tallyPlaceOptions(vote);
  const timeTallies = tallyTimeOptions(vote);

  const isOpen = vote.status === "OPEN";
  const isAllVoted = vote.votedCount >= vote.totalMembers;
  const showRevote = isOpen && vote.myVote !== null && !isAllVoted;
  // 마감된 투표에서만 동표를 안내한다. 진행 중에는 아직 결과가 아니다.
  const placeTied = !isOpen && isTied(placeTallies);
  const timeTied = !isOpen && isTied(timeTallies);

  const handleCloseVote = async () => {
    if (closing) return;
    setClosing(true);
    try {
      await onCloseVote();
    } finally {
      setClosing(false);
    }
  };

  const renderVoters = (voterIds: number[]) => {
    if (voterIds.length === 0) return null;
    const names = voterIds.map((id) => memberNameById.get(id) ?? "알 수 없음").join(", ");
    return <VotersLine>{names}</VotersLine>;
  };

  const renderOptionCard = (
    tally: VoteTally<VotePlaceOption | VoteTimeOption>,
    label: string,
    isMine: boolean,
    onCardClick?: () => void,
  ) => {
    const hasVotes = tally.count > 0;

    return (
      <OptionCard
        key={tally.option.optionId}
        $isWinner={tally.isWinner}
        $hasVotes={hasVotes}
        $isAllVoted={isAllVoted}
        $clickable={Boolean(onCardClick)}
        {...(onCardClick ? { type: "button" as const, onClick: onCardClick } : { as: "div" as const })}
      >
        <OptionHeader>
          <OptionLabelRow>
            <OptionLabel>{label}</OptionLabel>
            {isMine && <InlineCheckIcon />}
          </OptionLabelRow>
          {hasVotes && <VoteCount>{tally.count}명</VoteCount>}
        </OptionHeader>
        {hasVotes && renderVoters(tally.option.voterIds)}
        <ProgressTrack>
          <ProgressFill style={{ width: `${tally.ratio * 100}%` }} />
        </ProgressTrack>
      </OptionCard>
    );
  };

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="투표 결과">
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
            <SectionSubtext>
              {placeTied ? "표가 같아 장소가 정해지지 않았어요" : "장소를 탭하고 위치를 확인해 보세요"}
            </SectionSubtext>
          </SectionHeaderWrapper>
          <OptionList>
            {placeTallies.map((tally) => {
              const option = tally.option;
              const canOpenMap = canResolvePlaceMap(option);
              return renderOptionCard(
                tally,
                option.label,
                myPlaceIds.has(option.optionId),
                canOpenMap ? () => setMapTarget(option) : undefined,
              );
            })}
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
            {timeTied && <SectionSubtext>표가 같아 시간이 정해지지 않았어요</SectionSubtext>}
          </SectionHeaderWrapper>
          <OptionList>
            {timeTallies.map((tally) =>
              renderOptionCard(
                tally,
                // 표시 문구는 FE가 만든다 — 서버는 meetAt만 저장한다.
                formatMeetAt(tally.option.meetAt),
                myTimeIds.has(tally.option.optionId),
              ),
            )}
          </OptionList>
        </Section>
        <BottomSpacer />
      </Body>

      {isOpen && (
        <ActionArea>
          {showRevote && (
            <ActionButton type="button" onClick={onRevote}>
              다시 투표하기
            </ActionButton>
          )}
          <ActionButton type="button" onClick={handleCloseVote} disabled={closing}>
            {closing ? "마감하는 중..." : "투표 마감하기"}
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
    </Overlay>
  );
}
