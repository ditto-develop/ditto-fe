"use client";

import MatchingDay from "@/components/home/MatchingDay";
import ThisWeekQuiz from "@/components/home/ThisWeekQuiz";
import TimeLine from "@/components/home/Timeline";
import { MatchingCardType } from "@/components/home/MatchingDay";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { SystemService, SystemStateDto, QuizProgressService, QuizProgressDto, IntroNotesService } from "@/lib/api";
import { getMatchCandidates } from "@/features/matching/api/matchingApi";

const MainSectionContainer = styled.div`
  padding: 16px 0px;
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
  const [matchType, setMatchType] = useState<MatchingCardType>("beforematch");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stateRes = await SystemService.systemControllerGetSystemState();
        if (!stateRes.success || !stateRes.data) return;

        const fetchedPeriod = mapPeriod(stateRes.data.period);
        setPeriod(fetchedPeriod);

        // 소개 노트 완료 여부 (기간 무관하게 항상 확인)
        IntroNotesService.introNotesControllerGetMyIntroNotes()
          .then((res) => {
            if (res.success && res.data) {
              setIsIntroComplete(res.data.completedCount === 10);
            }
          })
          .catch(() => {});

        if (fetchedPeriod === "QUIZ") {
          const progressRes = await QuizProgressService.quizProgressControllerGetProgress();
          if (progressRes.success && progressRes.data) {
            setIsQuizComplete(
              progressRes.data.status === QuizProgressDto.status.COMPLETED
            );
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
      }
    }
    load();
  }, []);

  if (loading || period === null) {
    return <MainSectionContainer><TimeLine /></MainSectionContainer>;
  }

  const ControlSection = () => {
    switch (period) {
      case "QUIZ":
        return <ThisWeekQuiz iscomplete={isQuizComplete} isIntroComplete={isIntroComplete} />;
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
