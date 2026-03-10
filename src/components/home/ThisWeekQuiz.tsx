"use client";

import BottomSheet from "@/components/display/BottomSheet";
import {
  Body1Bold,
  Heading2Bold,
  Label2,
} from "@/components/common/Text";
import Card from "@/components/display/Card";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { useTargetDayCountdown } from "@/lib/hooks/useKstCountdown";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

const CardContainer = styled.div`
  display: flex;
  padding: 16px;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  flex: 1 1;
`;
const CardDivContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
`;
const ActionContainer = styled.div`
  width: 60%;
`;
const FCardContainer = styled.div`
  display: flex;
  padding: 16px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  flex: 1 0;
`;
const FCardDivContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0;
`;

const BottomButton = styled.div`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  border-radius: 12px;
  background: var(--color-fill-normal, rgba(108, 101, 95, 0.08));
`;

interface ThisWeekQuizProps {
  iscomplete: boolean;
  isIntroComplete: boolean;
  participantCount: number;
}

export default function ThisWeekQuiz({ iscomplete, isIntroComplete, participantCount }: ThisWeekQuizProps) {
  console.log('[src/components/home/ThisWeekQuiz.tsx] ThisWeekQuiz'); // __component_log__
  const router = useRouter();
  const today = new Date().getDay(); // (KST 변환 로직 필요 시 적용)
  const target = today === 4 ? 5 : 4;

  const timeLeft = useTargetDayCountdown(target);
  const [isQuizStart, setIsQuizStart] = useState(false);

  if (iscomplete) {
    return (
      <Card
        title="이번주 퀴즈"
        alert="참여 완료"
        alertType="positive"
        subTitle={
          <>
            매칭 결과를 준비 중이에요.
            <br />
            소개 노트를 완성하며 기다려주세요.
          </>
        }
        viewCard={
          <FCardContainer>
            <FCardDivContainer>
              <CardDivContainer>
                <img src="/icons/status/time.svg" />
                <Label2 $color="var(--color-semantic-label-alternative)">
                  남은 시간
                </Label2>
                <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
              </CardDivContainer>
              <CardDivContainer>
                <img src="/icons/content/people.svg" />
                <Label2 $color="var(--color-semantic-label-alternative)">
                  참여한 사람
                </Label2>
                <Body1Bold $weight="bold">{participantCount}명</Body1Bold>
              </CardDivContainer>
            </FCardDivContainer>
            <img src="/assets/illustration/quizpeople.svg" loading="lazy" />
          </FCardContainer>
        }
        buttonSection={
          !isIntroComplete ? (
            <ActionContainer>
              <ActionSheet>
                <ActionButton
                  variant="secondary"
                  icon={<img src="/icons/action/note-pen.svg" />}
                  onClick={() => router.push("/onboarding/intro")}
                >
                  소개 노트 작성하기
                </ActionButton>
              </ActionSheet>
            </ActionContainer>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      {isQuizStart && (
        <BottomSheet
          title="퀴즈의 종류를 선택하세요"
          subTitle="매주 한 종류의 퀴즈만 풀 수 있어요!"
          closer={() => setIsQuizStart(false)}
          detail={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <img src="/assets/illustration/quizstart.svg" loading="lazy" />
              <BottomButton
                onClick={() => {
                  router.push("/quiz/current");
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <img src="/icons/content/people-red.svg" />
                  <Label2
                    style={{ paddingTop: "3px" }}
                    $color="var(--color-semantic-accent-foreground-vintagePink)"
                  >
                    1:1 매칭
                  </Label2>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    alignContent: "center",
                    alignSelf: "stretch",
                  }}
                >
                  <Heading2Bold>성격, 가치관</Heading2Bold>
                  <img src="/icons/navigation/arrow-left.svg" style={{ rotate: "180deg" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    나와 잘 맞는 사람을 찾아봐요.
                  </Label2>
                </div>
              </BottomButton>
              <BottomButton
                onClick={() => {
                  router.push("/quiz/current");
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <img src="/icons/content/people-green.svg" />
                  <Label2
                    style={{ paddingTop: "3px" }}
                    $color="var(--color-atomic-olive-60)"
                  >
                    그룹 매칭
                  </Label2>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    alignContent: "center",
                    alignSelf: "stretch",
                  }}
                >
                  <Heading2Bold>취미, 취향</Heading2Bold>
                  <img src="/icons/navigation/arrow-left.svg" style={{ rotate: "180deg" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    비슷한 취향의 사람들과 연결돼요.
                  </Label2>
                </div>
              </BottomButton>
            </div>
          }
        />
      )}
      <Card
        title="이번주 퀴즈"
        alert="참여 가능"
        subTitle={
          <>
            매주 다른 퀴즈를 풀고,
            <br />
            새로운 만남을 시작해 보세요!
          </>
        }
        viewCard={
          <CardContainer>
            <CardDivContainer>
              <img src="/icons/status/time.svg" />
              <Label2 $color="var(--color-semantic-label-alternative)">
                남은 시간
              </Label2>
              <Body1Bold $weight="bold">{timeLeft}</Body1Bold>
            </CardDivContainer>
            <CardDivContainer>
              <img src="/icons/content/people.svg" />
              <Label2 $color="var(--color-semantic-label-alternative)">
                참여한 사람
              </Label2>
              <Body1Bold $weight="bold">{participantCount}명</Body1Bold>
            </CardDivContainer>
          </CardContainer>
        }
        buttonSection={
          <ActionContainer>
            <ActionSheet>
              <ActionButton
                onClick={() => {
                  setIsQuizStart(true);
                }}
                icon={<img src="/icons/action/plus.svg" />}
              >
                시작하기
              </ActionButton>
            </ActionSheet>
          </ActionContainer>
        }
      />
    </>
  );
}
