"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupMatchingResultModal } from "@/components/home/GroupMatchingResultModal";
import {
  getGroupCandidates,
  type GroupCandidateGroupDto,
} from "@/features/matching/api/matchingApi";
import { useGroupName } from "@/features/matching/hooks/useGroupName";
import { isGroupMatchFailed } from "@/features/matching/model/groupMatchState";
import { getSystemPeriod } from "@/features/system/api/systemStateApi";
import { API_ERROR_CODE, hasApiErrorCode } from "@/shared/lib/api/apiError";
import { goBackOr } from "@/shared/lib/navigation";
import { EmptyState, TopNavigation } from "@/shared/ui";

type GroupMatchingState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      quizSetId: string | null;
      groups: GroupCandidateGroupDto[];
      isChattingPeriod: boolean;
    };

/**
 * 후보 그룹과 서버 기간을 함께 읽는다. 실패 판정에 둘 다 필요하다(isGroupMatchFailed).
 *
 * 이번 주에 그룹 퀴즈를 완주하지 않았으면 서버가 404(`0004`)를 준다. 후보 0명과 구분되지
 * 않으므로 둘 다 "매칭 실패"로 다룬다(externalApi.getExternalGroupCandidates).
 */
async function fetchGroupMatching(): Promise<GroupMatchingState> {
  try {
    const [candidates, period] = await Promise.all([
      getGroupCandidates().catch((error: unknown) => {
        if (hasApiErrorCode(error, API_ERROR_CODE.NOT_FOUND)) return null;
        throw error;
      }),
      getSystemPeriod(),
    ]);
    return {
      status: "ready",
      quizSetId: candidates?.quizSetId ?? null,
      groups: candidates?.groups ?? [],
      isChattingPeriod: period === "CHATTING_PERIOD",
    };
  } catch {
    return { status: "error" };
  }
}

/**
 * 그룹 매칭 결과 화면 `/matching/group/`.
 *
 * 그룹 주의 매칭 결과·매칭 실패(`MATCH_RESULT`·`NO_MATCH`)와 인원 미달(`GROUP_NOT_FORMED`)
 * 알림이 여기로 온다(BE 위키 Frontend-DeepLink-Guide, ditto-fe#23). 홈의 그룹 결과 모달은
 * 매칭 카드 버튼으로만 열려 URL 로 들어올 수 없어서, 같은 모달을 이 경로의 화면으로 띄운다.
 * 닫으면(참여 성사·거절 포함) 들어오기 전 화면으로, 없으면 홈으로 간다.
 */
export function GroupMatchingPageClient() {
  const router = useRouter();
  const [state, setState] = useState<GroupMatchingState>({ status: "loading" });
  const groupName = useGroupName(state.status === "ready" ? state.quizSetId : null);

  useEffect(() => {
    let active = true;
    void fetchGroupMatching().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const goBack = () => goBackOr(router, "/home");

  if (state.status !== "ready") {
    return (
      <Page>
        <TopNavigation onBack={goBack} />
        <StateText>
          {state.status === "loading"
            ? "매칭 결과를 불러오는 중..."
            : "매칭 결과를 불러오지 못했어요."}
        </StateText>
      </Page>
    );
  }

  const activeGroup = state.groups[0];
  if (!activeGroup || isGroupMatchFailed(activeGroup, state.isChattingPeriod)) {
    // 문구는 홈의 매칭 실패 카드(FailMatchCard)와 같다.
    return (
      <Page>
        <TopNavigation onBack={goBack} />
        <EmptyStateSlot>
          <EmptyState
            icon="content.people"
            title="진행 중인 매칭이 없어요"
            description="다음주에 다시 인연을 만들어 보세요."
          />
        </EmptyStateSlot>
      </Page>
    );
  }

  return (
    <GroupMatchingResultModal
      isOpen
      onClose={goBack}
      group={activeGroup}
      groupName={groupName}
      // 홈과 같다: 수락하면 같은 주의 다른 후보는 서버에서 자동 거절된다.
      onAccepted={(isFormed) =>
        setState((prev) =>
          prev.status === "ready" && prev.groups.length > 0
            ? { ...prev, groups: [{ ...prev.groups[0], myStatus: "ACCEPTED", isFormed }] }
            : prev,
        )
      }
      onDeclined={() =>
        setState((prev) =>
          prev.status === "ready" ? { ...prev, groups: prev.groups.slice(1) } : prev,
        )
      }
      onStale={() => {
        void fetchGroupMatching().then(setState);
      }}
    />
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const StateText = styled.p`
  margin: 0;
  padding: var(--space-8) 0;
  text-align: center;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

/* 빈 상태는 상단 바를 뺀 남은 영역의 정중앙에 놓인다(알림 센터와 같다). */
const EmptyStateSlot = styled.div`
  display: flex;
  flex: 1 0 0;
  align-items: center;
  justify-content: center;
`;
