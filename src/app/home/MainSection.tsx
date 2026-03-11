"use client";

import MatchingDay from "@/components/home/MatchingDay";
import ThisWeekQuiz from "@/components/home/ThisWeekQuiz";
import TimeLine from "@/components/home/Timeline";
import { MatchingCardType } from "@/components/home/MatchingDay";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { SystemService, SystemStateDto, QuizProgressService, QuizProgressDto, IntroNotesService } from "@/lib/api";
import { getMatchCandidates } from "@/features/matching/api/matchingApi";
import { useHomeReady } from "@/context/HomeReadyContext";

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
  const [loading, setLoading] = useState(true);
  const { setHomeReady } = useHomeReady();

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
            const { candidates } = await getMatchCandidates();
            if (candidates.length === 0) setMatchType("failmatch");
            else if (candidates.length === 1) setMatchType("one");
            else setMatchType("many");
          } catch {
            // 퀴즈 미참여 등으로 매칭 결과 없음
            setMatchType("beforematch");
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
          />
        );
      case "CHATTING":
        return (
          <MatchingDay
            isChatTime={true}
            day={dayIndex}
            matchType={matchType}
            buttonState="primary"
          />
        );
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
