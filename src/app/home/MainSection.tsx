"use client";

import MatchingDay from "@/components/home/MatchingDay";
import ThisWeekQuiz from "@/components/home/ThisWeekQuiz";
import TimeLine from "@/components/home/Timeline";
import { MatchingCardType } from "@/components/home/MatchingDay";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { SystemService, SystemStateDto, QuizProgressService, QuizProgressDto, IntroNotesService, ChatService } from "@/lib/api";
import { getMatchCandidates, getMatchingStatus, MatchCandidateDto } from "@/features/matching/api/matchingApi";
import type { ChatRoomItemDto } from "@/lib/api/models/ChatRoomItemDto";
import { useHomeReady } from "@/context/HomeReadyContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

const MainSectionContainer = styled.div`
  padding: 16px 0px 80px;
  display: grid;
  gap: 24px;
`;

type Period = "QUIZ" | "MATCHING" | "CHATTING";

function getKstDayIndex(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(utc + kstOffset);
  return kstDate.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
}

function mapPeriod(apiPeriod: SystemStateDto.period): Period {
  switch (apiPeriod) {
    case SystemStateDto.period.QUIZ_PERIOD: return "QUIZ";
    case SystemStateDto.period.MATCHING_PERIOD: return "MATCHING";
    case SystemStateDto.period.CHATTING_PERIOD: return "CHATTING";
  }
}

export default function MainSection() {
  console.log('[src/app/home/MainSection.tsx] MainSection'); // __component_log__
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
  const [chatRoom, setChatRoom] = useState<ChatRoomItemDto | undefined>(undefined);
  const [acceptedMatchRequestId, setAcceptedMatchRequestId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { setHomeReady } = useHomeReady();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  // 대화 수락 후 홈으로 돌아왔을 때 스낵바 표시
  useEffect(() => {
    if (searchParams.get("accepted") !== "true") return;
    showToast("상대방이 대화를 수락했어요! 대화는 금요일에 시작돼요.", "success");
    router.replace("/home");
  }, [searchParams, showToast, router]);


  useEffect(() => {
    // 마운트 시 리셋: 홈으로 다시 진입할 때 Splash가 다시 뜨도록
    setHomeReady(false);

    async function load() {
      try {
        // systemState와 introNotes를 병렬로 요청
        const [stateRes, introRes] = await Promise.all([
          SystemService.systemControllerGetSystemState(),
          IntroNotesService.introNotesControllerGetMyIntroNotes().catch(() => null),
        ]);

        if (!stateRes.success || !stateRes.data) return;

        const fetchedPeriod = mapPeriod(stateRes.data.period);
        setPeriod(fetchedPeriod);

        if (introRes?.success && introRes.data) {
          setIsIntroComplete(introRes.data.completedCount === 10);
        }

        if (fetchedPeriod === "QUIZ") {
          const progressRes = await QuizProgressService.quizProgressControllerGetProgress();
          if (progressRes.success && progressRes.data) {
            setIsQuizComplete(
              progressRes.data.status === QuizProgressDto.status.COMPLETED
            );
            setParticipantCount(progressRes.data.participantCount ?? 0);
          }
        } else {
          // MATCHING or CHATTING: 매칭 결과로 matchType 결정
          try {
            const { quizSetId: fetchedQuizSetId, candidates: fetchedCandidates, matchingType } = await getMatchCandidates();
            const quizSetId = fetchedQuizSetId;
            setQuizSetId(fetchedQuizSetId);
            const { hasAcceptedMatch: accepted, acceptedMatchUserId, groupDeclined, groupJoined: joined, groupJoinPending: joinPending, sentRequests, receivedRequests } = await getMatchingStatus(quizSetId);
            setCandidates(fetchedCandidates);
            setHasAcceptedMatch(accepted);
            setGroupJoined(joined);
            setGroupJoinPending(joinPending);
            if (accepted && acceptedMatchUserId) {
              const found = fetchedCandidates.find(c => c.userId === acceptedMatchUserId);
              setAcceptedCandidate(found);
              // 수락된 매칭 요청 ID 찾기 (채팅방 생성에 필요)
              const acceptedReq = [...sentRequests, ...receivedRequests].find(r => r.status === "ACCEPTED");
              if (acceptedReq) setAcceptedMatchRequestId(acceptedReq.id);
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
            if (fetchedPeriod === "CHATTING") {
              const chatRes = await ChatService.chatControllerGetChatRooms();
              if (chatRes.success && chatRes.data && chatRes.data.length > 0) {
                setChatRoom(chatRes.data[0]);
              }
            }
          } catch {
            // 퀴즈를 풀지 않았거나 매칭 후보가 없는 경우 → failmatch
            setMatchType("failmatch");
          }
        }
      } catch {
        // 네트워크 오류 등 — 로딩만 해제
      } finally {
        setLoading(false);
        setHomeReady(true);
      }
    }
    load();
  }, [setHomeReady]);

  if (loading || period === null) {
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
        const handleStartChat = async () => {
          try {
            if (chatRoom) {
              router.push(`/chat/one-on-one/${chatRoom.roomId}`);
              return;
            }
            if (!acceptedMatchRequestId) return;
            const res = await ChatService.chatControllerCreateChatRoom({ matchRequestId: acceptedMatchRequestId });
            if (res.success && res.data) {
              setChatRoom(res.data);
              router.push(`/chat/one-on-one/${res.data.roomId}`);
            }
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
      {ControlSection()}
    </MainSectionContainer>
  );
}
