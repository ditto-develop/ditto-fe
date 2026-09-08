"use client";

import { MatchingDay } from "@/components/home/MatchingDay";
import { MatchingCardSkeleton } from "@/components/home/_parts/MatchingCardSkeleton";
import { matchAcceptedNotifKey } from "@/components/home/_parts/MatchingDay.helpers";
import { ThisWeekQuiz } from "@/components/home/ThisWeekQuiz";
import { TimeLine } from "@/components/home/Timeline";
import type { MatchingCardType } from "@/components/home/MatchingDay";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { QuizProgressDto } from "@/shared/lib/api/generated";
import type { SystemStateDto } from "@/shared/lib/api/generated";
import { getChatRooms } from "@/features/chat";
import type { ChatRoom } from "@/features/chat";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { getMatchCandidates, getMatchingStatus } from "@/features/matching/api/matchingApi";
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
  padding: 4px 0px calc(64px + env(safe-area-inset-bottom, 0px));
  display: grid;
  gap: 10px;
`;


type Period = "QUIZ" | "MATCHING" | "CHATTING";

function getKstDayIndex(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(utc + kstOffset);
  return kstDate.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
}

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
  const [dayIndex] = useState<number>(getKstDayIndex());
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [matchType, setMatchType] = useState<MatchingCardType>("beforematch");
  const [candidates, setCandidates] = useState<MatchCandidateDto[]>([]);
  const [quizSetId, setQuizSetId] = useState<string>("");
  const [hasAcceptedMatch, setHasAcceptedMatch] = useState(false);
  const [acceptedCandidate, setAcceptedCandidate] = useState<MatchCandidateDto | undefined>(undefined);
  const [groupJoined, setGroupJoined] = useState(false);
  const [groupJoinPending, setGroupJoinPending] = useState(false);
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


  useEffect(() => {
    // 마운트 시 리셋: 홈으로 다시 진입할 때 Splash가 다시 뜨도록
    setHomeReady(false);

    async function load() {
      try {
        // 기간 판정·매칭 후보·소개노트는 서로 의존하지 않는다. 순차로 기다리면 홈 카드가
        // 그만큼 늦게 뜨므로 같이 쏜다. 퀴즈 기간에는 후보 조회 1건이 버려지지만,
        // 매칭/대화 기간(카드가 무거운 쪽)의 왕복이 한 번 줄어드는 편이 낫다.
        const [systemState, candidateResult, introNotes] = await Promise.all([
          getExternalSystemState(),
          getMatchCandidates().catch(() => null),
          getExternalMyIntroNotes().catch(() => null),
        ]);

        const fetchedPeriod = mapSystemPeriod(systemState.period);
        setPeriod(fetchedPeriod);

        if (introNotes) {
          setIsIntroComplete(introNotes.completedCount === INTRO_NOTE_FIELDS.length);
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

        // MATCHING or CHATTING: 매칭 결과로 matchType 결정
        // 후보 조회가 실패했으면(퀴즈 미응시 등) 더 볼 것 없이 failmatch.
        if (!candidateResult) {
          setMatchType("failmatch");
          return;
        }

        try {
          const { quizSetId: fetchedQuizSetId, candidates: fetchedCandidates, matchingType } = candidateResult;
          setQuizSetId(fetchedQuizSetId);
          setCandidates(fetchedCandidates);

          // 매칭 상태와 최신 채팅방도 서로 독립이라 함께 기다린다.
          const [status, latestChatRoom] = await Promise.all([
            getMatchingStatus(fetchedQuizSetId),
            fetchedPeriod === "CHATTING"
              ? getLatestChatRoom().catch(() => undefined)
              : Promise.resolve(undefined),
          ]);

          const {
            hasAcceptedMatch: accepted,
            acceptedMatchUserId,
            groupDeclined,
            groupJoined: joined,
            groupJoinPending: joinPending,
          } = status;

          setHasAcceptedMatch(accepted);
          setGroupJoined(joined);
          setGroupJoinPending(joinPending);
          if (accepted && acceptedMatchUserId) {
            const found = fetchedCandidates.find(c => c.userId === acceptedMatchUserId);
            setAcceptedCandidate(found);
          }
          if (fetchedCandidates.length === 0 || groupDeclined) setMatchType("failmatch");
          else if (matchingType === 'GROUP') {
            // 대화 기간에는 그룹에 참여한 경우만 표시
            if (fetchedPeriod === "CHATTING" && !joined) setMatchType("failmatch");
            else setMatchType("many");
          } else {
            // 대화 기간에는 매칭이 확정된 경우만 표시
            if (fetchedPeriod === "CHATTING" && !accepted) setMatchType("failmatch");
            else setMatchType("one");
          }
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
    }
    load();
  }, [setHomeReady]);

  useEffect(() => {
    if (period !== "CHATTING") return;

    let isMounted = true;
    let isFetching = false;

    const refreshLatestChatRoom = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const latestChatRoom = await getLatestChatRoom();
        if (isMounted && latestChatRoom) setChatRoom(latestChatRoom);
      } catch {
        // ignore
      } finally {
        isFetching = false;
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      refreshLatestChatRoom();
    }, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [period]);

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

  const ControlSection = () => {
    switch (period) {
      case "QUIZ":
        return <ThisWeekQuiz iscomplete={isQuizComplete} isIntroComplete={isIntroComplete} participantCount={participantCount} />;
      case "MATCHING":
        return (
          <MatchingDay
            isChatTime={false}
            day={dayIndex}
            matchType={matchType}
            buttonState="primary"
            candidates={candidates}
            hasAcceptedMatch={hasAcceptedMatch}
            acceptedCandidate={acceptedCandidate}
            groupJoined={groupJoined}
            onGroupJoined={() => setGroupJoined(true)}
            groupJoinPending={groupJoinPending}
            onGroupJoinPending={() => setGroupJoinPending(true)}
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
            day={dayIndex}
            matchType={matchType}
            buttonState="primary"
            candidates={candidates}
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
