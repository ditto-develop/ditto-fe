"use client";

import { MatchingDay } from "@/components/home/MatchingDay";
import { MatchingCardSkeleton } from "@/components/home/_parts/MatchingCardSkeleton";
import { matchAcceptedNotifKey } from "@/components/home/_parts/MatchingDay.helpers";
import { ThisWeekQuiz } from "@/components/home/ThisWeekQuiz";
import { TimeLine } from "@/components/home/Timeline";
import type { MatchingCardType } from "@/components/home/MatchingDay";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { usePolling } from "@/shared/lib/hooks/usePolling";
import { POLLING_INTERVAL_MS } from "@/shared/lib/constants/polling";
import { QuizProgressDto } from "@/shared/lib/api/generated";
import type { SystemStateDto } from "@/shared/lib/api/generated";
import { getChatRooms } from "@/features/chat";
import type { ChatRoom } from "@/features/chat";
import type { GroupCandidateGroupDto, MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { getGroupCandidates, getMatchCandidates, getMatchingStatus, isCurrentWeek } from "@/features/matching/api/matchingApi";
import {
  getExternalMyIntroNotes,
  getExternalQuizProgress,
  getExternalSystemState,
} from "@/shared/lib/api/externalApi";
import { useHomeReady } from "@/context/HomeReadyContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { describeError } from "@/shared/lib/api/apiError";

const MainSectionContainer = styled.div`
  /**
   * 하단 여백은 하단 탭(MainBottomNav)을 피하려는 값이다.
   * 탭의 실제 높이가 60px + 홈 인디케이터 인셋이라, 80px 고정이면 앱에서
   * 인셋만큼 카드 아래가 탭에 가린다.
   */
  padding: 16px 0 calc(64px + env(safe-area-inset-bottom, 0px));
  display: grid;
  /* Figma 2.1 Home: 상단 내비→첫 카드 16px, 카드 사이 24px. */
  gap: 24px;
`;


/**
 * "참여한 사람" 수를 다시 당기는 주기.
 *
 * 아래 채팅방 갱신(3초)보다 훨씬 느슨하다. 그쪽은 "상대가 수락하면 방이 바로 떠야
 * 한다"는 요구지만 이건 카운터 하나라, 20초면 체감상 실시간이면서 서버 부담은 1/7 이다.
 */
const QUIZ_PARTICIPANT_POLL_INTERVAL_MS = 20_000;

type Period = "QUIZ" | "MATCHING" | "CHATTING";

function mapSystemPeriod(apiPeriod: SystemStateDto["period"]): Period {
  switch (apiPeriod) {
    case "QUIZ_PERIOD":
      return "QUIZ";
    case "MATCHING_PERIOD":
      return "MATCHING";
    case "CHATTING_PERIOD":
      return "CHATTING";
    default:
      throw new Error(`Unsupported system period: ${String(apiPeriod)}`);
  }
}

/** 방 목록은 최근 대화순이라 첫 번째가 가장 최근 방이다. */
async function getLatestChatRoom(): Promise<ChatRoom | undefined> {
  const rooms = await getChatRooms();
  return rooms[0];
}

export function MainSection() {
  const [period, setPeriod] = useState<Period | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  // null = 소개 노트 조회 실패(개수를 모름). 퀴즈 진입을 막지 않는다.
  const [introNoteCount, setIntroNoteCount] = useState<number | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [matchType, setMatchType] = useState<MatchingCardType>("beforematch");
  const [candidates, setCandidates] = useState<MatchCandidateDto[]>([]);
  const [quizSetId, setQuizSetId] = useState<string>("");
  const [hasAcceptedMatch, setHasAcceptedMatch] = useState(false);
  const [acceptedCandidate, setAcceptedCandidate] = useState<MatchCandidateDto | undefined>(undefined);
  /**
   * 이번 주가 그룹 주인지. 그룹 화면 상태는 전부 `groups[0]`에서 나온다 —
   * 매칭 상태(`/matching/status`)의 groupJoined/groupJoinPending/groupDeclined 는 쓰지 않는다
   * (BE 위키 Frontend-Group-Matching-Guide §화면 상태 판단).
   */
  const [isGroupWeek, setIsGroupWeek] = useState(false);
  const [groups, setGroups] = useState<GroupCandidateGroupDto[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { setHomeReady } = useHomeReady();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  // 대화 수락 후 홈으로 돌아왔을 때 스낵바 표시
  useEffect(() => {
    if (searchParams.get("accepted") !== "true") return;
    // MatchingDay의 매칭 완료 알림과 같은 내용이므로, 본 것으로 마킹해 중복 toast를 막는다
    const storedQuizSetId = sessionStorage.getItem("currentQuizSetId");
    if (storedQuizSetId) localStorage.setItem(matchAcceptedNotifKey(storedQuizSetId), "1");
    showToast("상대방이 대화를 수락했어요! 대화는 금요일에 시작돼요.", "success");
    router.replace("/home");
  }, [searchParams, showToast, router]);


  /**
   * 마운트 시 1회 호출되고, MATCHING 기간에는 아래 폴링 effect에서도 재호출된다
   * (QUIZ/CHATTING은 각자 더 가벼운 전용 폴링이 있어 여기서 다시 돌리지 않는다).
   * setter만 참조하므로 의존성 없이 고정된 참조를 유지한다.
   */
  const load = useCallback(async () => {
    try {
        // 기간 판정·매칭 후보·소개노트는 서로 의존하지 않는다. 순차로 기다리면 홈 카드가
        // 그만큼 늦게 뜨므로 같이 쏜다. 퀴즈 기간에는 후보 조회 1건이 버려지지만,
        // 매칭/대화 기간(카드가 무거운 쪽)의 왕복이 한 번 줄어드는 편이 낫다.
        const [systemState, candidateResult, groupResult, introNotes] = await Promise.all([
          getExternalSystemState(),
          getMatchCandidates().catch(() => null),
          getGroupCandidates().catch(() => null),
          getExternalMyIntroNotes().catch(() => null),
        ]);

        const fetchedPeriod = mapSystemPeriod(systemState.period);
        setPeriod(fetchedPeriod);

        if (introNotes) {
          setIntroNoteCount(introNotes.completedCount);
        }

        if (fetchedPeriod === "QUIZ") {
          const progress = await getExternalQuizProgress();
          if (progress) {
            setIsQuizComplete(
              progress.status === QuizProgressDto.status.COMPLETED
            );
            setParticipantCount(progress.participantCount ?? 0);
          }
          return;
        }

        /**
         * MATCHING or CHATTING: 이번 주가 1:1인지 그룹인지 가른다.
         *
         * 두 엔드포인트는 **이번 운영 주에** 내가 완주한 퀴즈셋만 본다(BE PR #176 / ADR 0026).
         * 이번 주에 안 푼 타입은 404(`0004`)라 응답이 오는 쪽이 곧 이번 주 트랙이다 —
         * 예전의 "퀴즈셋 ID가 큰 쪽" 추측은 더 이상 필요 없다. 캐시된 지난 주 응답만
         * 걸러 내려고 `weekStartedOn` 을 system/state 와 한 줄 대조한다.
         *
         * 그룹이 이번 주면 후보가 0개여도 그룹 경로로 판정해야 한다 — 그래야 지난 주
         * 1:1 후보가 되살아나지 않는다.
         */
        const currentWeekStartedOn = systemState.weekStartedOn;
        const groupThisWeek =
          groupResult !== null && isCurrentWeek(groupResult.weekStartedOn, currentWeekStartedOn)
            ? groupResult
            : null;
        const candidateThisWeek =
          candidateResult !== null && isCurrentWeek(candidateResult.weekStartedOn, currentWeekStartedOn)
            ? candidateResult
            : null;

        if (groupThisWeek) {
          setIsGroupWeek(true);
          setQuizSetId(groupThisWeek.quizSetId);
          setGroups(groupThisWeek.groups);
          if (fetchedPeriod === "CHATTING") {
            const latestChatRoom = await getLatestChatRoom().catch(() => undefined);
            if (latestChatRoom) setChatRoom(latestChatRoom);
          }
          return;
        }

        // 이번 주 후보가 없으면(퀴즈 미응시 등) 더 볼 것 없이 failmatch.
        if (!candidateThisWeek) {
          setMatchType("failmatch");
          return;
        }

        try {
          const { quizSetId: fetchedQuizSetId, candidates: fetchedCandidates } = candidateThisWeek;
          setQuizSetId(fetchedQuizSetId);
          setCandidates(fetchedCandidates);

          // 매칭 상태와 최신 채팅방도 서로 독립이라 함께 기다린다.
          const [status, latestChatRoom] = await Promise.all([
            getMatchingStatus(fetchedQuizSetId),
            fetchedPeriod === "CHATTING"
              ? getLatestChatRoom().catch(() => undefined)
              : Promise.resolve(undefined),
          ]);

          const { hasAcceptedMatch: accepted, acceptedMatchUserId } = status;

          setHasAcceptedMatch(accepted);
          if (accepted && acceptedMatchUserId) {
            const found = fetchedCandidates.find(c => c.userId === acceptedMatchUserId);
            setAcceptedCandidate(found);
          }
          if (fetchedCandidates.length === 0) setMatchType("failmatch");
          // 대화 기간에는 매칭이 확정된 경우만 표시
          else if (fetchedPeriod === "CHATTING" && !accepted) setMatchType("failmatch");
          else setMatchType("one");
          if (latestChatRoom) setChatRoom(latestChatRoom);
        } catch (err: unknown) {
          // 매칭 상태 조회 실패 → failmatch
          console.error("[MainSection] 매칭 상태 조회 실패, failmatch로 폴백:", describeError(err));
          setMatchType("failmatch");
        }
    } catch (err: unknown) {
      console.error("[MainSection] 홈 데이터 로딩 실패:", describeError(err));
    } finally {
      setLoading(false);
      setHomeReady(true);
    }
  }, [setHomeReady]);

  useEffect(() => {
    // 마운트 시 리셋: 홈으로 다시 진입할 때 Splash가 다시 뜨도록
    setHomeReady(false);
    void load();
  }, [load, setHomeReady]);

  /**
   * MATCHING 기간에는 후보 수락/거절·그룹 성사 여부가 상대방 행동에 따라 바뀔 수 있어
   * 화면을 열어 둔 동안 전체 로딩을 다시 돈다. QUIZ/CHATTING은 각자 더 가벼운 전용
   * 폴링(아래)이 있으므로 여기서 중복으로 돌리지 않는다.
   */
  usePolling(load, POLLING_INTERVAL_MS, { enabled: period === "MATCHING" });

  const refreshLatestChatRoom = useCallback(async () => {
    const latestChatRoom = await getLatestChatRoom();
    if (latestChatRoom) setChatRoom(latestChatRoom);
  }, []);

  usePolling(refreshLatestChatRoom, 3000, { enabled: period === "CHATTING" });

  /**
   * 퀴즈 기간 동안 "참여한 사람" 수를 따라 올린다. 서버가 이 값을 밀어 주는 채널이
   * 없어서 폴링이다(BE 에 브로드캐스트 토픽이 생기면 STOMP 구독으로 갈아탈 자리).
   *
   * `participantCount` 만 갱신하고 `isQuizComplete` 는 건드리지 않는다. 폴링 도중
   * 카드 상태가 open → completed 로 뒤집히면 `ThisWeekQuiz` 의 `useCardImpression` 이
   * 노출 이벤트를 다시 쏘고, 퀴즈 카드 클릭률의 분모가 통째로 틀어진다.
   */
  const refreshParticipantCount = useCallback(async () => {
    const progress = await getExternalQuizProgress();
    setParticipantCount(progress.participantCount ?? 0);
  }, []);

  usePolling(refreshParticipantCount, QUIZ_PARTICIPANT_POLL_INTERVAL_MS, {
    enabled: period === "QUIZ",
  });

  // 로딩 중에는 카드 자리를 스켈레톤으로 잡아둔다. 스플래시가 2.5초에 먼저 걷혀도
  // 타임라인만 덩그러니 남았다가 카드가 뒤늦게 밀고 들어오는 일이 없다.
  if (loading) {
    return (
      <MainSectionContainer>
        <TimeLine />
        <MatchingCardSkeleton />
      </MainSectionContainer>
    );
  }

  // 기간 조회 자체가 실패한 경우: 무한 스켈레톤 대신 타임라인만 남긴다.
  if (period === null) {
    return <MainSectionContainer><TimeLine /></MainSectionContainer>;
  }

  /**
   * 그룹 화면은 `groups[0]`만으로 전부 갈린다(BE 위키 §화면 상태 판단).
   * - 후보 없음 → 매칭 실패
   * - PENDING → 매칭 결과(거절하기 / 참여하기)
   * - ACCEPTED && !isFormed → 참여함 · 인원 대기
   * - ACCEPTED && isFormed → 매칭 완료
   * 대화 기간에는 성사된 그룹을 수락한 경우만 남긴다.
   */
  const activeGroup = groups[0];
  const groupFormed = !!activeGroup && activeGroup.myStatus === "ACCEPTED" && activeGroup.isFormed;
  const groupMatchType: MatchingCardType = !activeGroup
    ? "failmatch"
    : period === "CHATTING" && !groupFormed
      ? "failmatch"
      : "many";

  const resolvedMatchType = isGroupWeek ? groupMatchType : matchType;
  const resolvedCandidates = isGroupWeek ? (activeGroup?.members ?? []) : candidates;

  /**
   * 수락하면 같은 주의 다른 후보는 서버에서 자동 거절된다 — 목록에서도 지워 둔다.
   * 정원이 4~6명이고 성사는 3명이라, 이미 성사된 그룹에 4번째로 수락하는 것도 정상 경로다.
   */
  const handleGroupAccepted = (isFormed: boolean) => {
    setGroups((prev) =>
      prev.length === 0 ? prev : [{ ...prev[0], myStatus: "ACCEPTED", isFormed }],
    );
  };

  /** 거절한 그룹은 서버 목록에서도 사라진다. 다음 후보가 있으면 추가 요청 없이 이어서 보여 준다. */
  const handleGroupDeclined = () => setGroups((prev) => prev.slice(1));

  /**
   * 다른 탭·기기에서 먼저 응답했거나 주가 바뀌어 서버와 어긋났을 때(0003/5005/5006/5008).
   * 에러를 띄우는 대신 목록을 다시 받아 화면을 맞춘다.
   */
  const refreshGroups = async () => {
    const result = await getGroupCandidates().catch(() => null);
    setGroups(result?.groups ?? []);
  };

  const ControlSection = () => {
    switch (period) {
      case "QUIZ":
        return <ThisWeekQuiz iscomplete={isQuizComplete} introNoteCount={introNoteCount} participantCount={participantCount} />;
      case "MATCHING":
        return (
          <MatchingDay
            isChatTime={false}
            matchType={resolvedMatchType}
            buttonState="primary"
            candidates={resolvedCandidates}
            hasAcceptedMatch={hasAcceptedMatch}
            acceptedCandidate={acceptedCandidate}
            group={activeGroup}
            onGroupAccepted={handleGroupAccepted}
            onGroupDeclined={handleGroupDeclined}
            onGroupStale={refreshGroups}
            quizSetId={quizSetId}
          />
        );
      case "CHATTING": {
        const getChatPath = (room: ChatRoom) =>
          room.sourceType === "GROUP"
            ? `/chat/group/${room.roomId}`
            : `/chat/one-on-one/${room.roomId}`;

        /**
         * 방은 서버가 만든다 — 1:1은 매칭 수락 즉시, 그룹은 정원이 차는 즉시.
         * 클라가 방을 만드는 경로는 없으므로 아직 안 보이면 다시 읽어 본다.
         */
        const handleStartChat = async () => {
          try {
            const room = chatRoom ?? (await getLatestChatRoom());
            if (!room) {
              showToast("아직 대화방이 열리지 않았어요. 잠시 후 다시 시도해주세요.", "error");
              return;
            }

            setChatRoom(room);
            router.push(getChatPath(room));
          } catch {
            showToast("채팅방을 열 수 없어요. 잠시 후 다시 시도해주세요.", "error");
          }
        };
        return (
          <MatchingDay
            isChatTime={true}
            matchType={resolvedMatchType}
            buttonState="primary"
            candidates={resolvedCandidates}
            hasAcceptedMatch={hasAcceptedMatch}
            acceptedCandidate={acceptedCandidate}
            chatRoom={chatRoom}
            onStartChat={handleStartChat}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <MainSectionContainer>
      <TimeLine />
      {/* 카드를 래퍼로 감싸지 않는다. animation/transform이 걸린 래퍼는 position:fixed
          자식(그룹 매칭 결과 모달 등)의 컨테이닝 블록이 돼서 모달이 어긋난다. */}
      {ControlSection()}
    </MainSectionContainer>
  );
}
