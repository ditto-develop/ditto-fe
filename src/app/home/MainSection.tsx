"use client";

import MatchingDay from "@/components/home/MatchingDay";
import ThisWeekQuiz from "@/components/home/ThisWeekQuiz";
import TimeLine from "@/components/home/Timeline";
import { MatchingCardType } from "@/components/home/MatchingDay";
import { useEffect, useState } from "react";
import styled from "styled-components";

const MainSectionContainer = styled.div`
  padding: 16px 0px;
  display: grid;
  gap: 24px;
`;

type Period = "QUIZ" | "MATCHING" | "CHATTING";

export default function MainSection() {
  const [period, setPeriod] = useState<Period | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);

  // NOTE: API 응답을 시뮬레이션하기 위한 임시 dummy data
  const [dummyApiData, setDummyApiData] = useState({
    matchType: "many" as MatchingCardType,
    isQuizComplete: false,
    buttonState: "primary" as "primary" | "secondary" | "tertiary" | "disabled" | undefined,
  });

  useEffect(() => {
    const getKstDay = () => {
      // Original date calculation logic commented out for temporary display
      // const now = new Date();
      // const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
      // const kstOffset = 9 * 60 * 60 * 1000;
      // const kstDate = new Date(utc + kstOffset);
      // const index = kstDate.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
      
      // Temporarily force display to Monday (day index 1) and QUIZ period
      setDayIndex(1);
      setPeriod("QUIZ");

      // Original conditional logic commented out
      // if ([1, 2, 3].includes(index)) {
      //   setPeriod("QUIZ");
      // } else if (index === 4) {
      //   setPeriod("MATCHING");
      // } else { // Fri, Sat, Sun
      //   setPeriod("CHATTING");
      // }
    };

    getKstDay();
  }, []);

  const ControlSection = () => {
    if (period === null || dayIndex === null) {
      return null; // or a loading spinner
    }

    switch (period) {
      case "QUIZ":
        return <ThisWeekQuiz iscomplete={dummyApiData.isQuizComplete} />;
      
      case "MATCHING":
        return (
          <MatchingDay
            isChatTime={false}
            day={dayIndex}
            matchType={dummyApiData.matchType}
            buttonState={dummyApiData.buttonState}
          />
        );

      case "CHATTING":
        return (
          <MatchingDay
            isChatTime={true}
            day={dayIndex}
            matchType={dummyApiData.matchType}
            buttonState={dummyApiData.buttonState}
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
