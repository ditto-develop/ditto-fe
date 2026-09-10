"use client";

import { AlertModal, BottomSheet } from "@/shared/ui";
import {
  Body1Bold,
  Heading2Bold,
  Label2,
} from "@/shared/ui";
import { Card } from "@/components/display/Card";
import { trackCardClick, useCardImpression } from "@/shared/lib/analytics";
import { ActionButton } from "@/components/input/Action";
import {
  INTRO_NOTE_FIELDS,
  MIN_INTRO_NOTE_ANSWERS,
} from "@/features/profile/model/introNotes";
import { useTargetDayCountdown } from "@/lib/hooks/useKstCountdown";
import { QUIZ_SELECT_QUERY_KEY, QUIZ_SELECT_QUERY_VALUE } from "@/components/quiz/QuizModal";
import { getExternalCurrentWeekQuizSets } from "@/shared/lib/api/externalApi";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";

/** 퀴즈 종류. 서버 퀴즈 세트의 matchingType 과 같은 값이다. */
type QuizMatchingType = "ONE_TO_ONE" | "GROUP";

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
const FullWidthButtonWrapper = styled.div`
  width: 100%;
`;
const IntroNoteButton = styled(ActionButton)`
  white-space: nowrap;
  font-weight: 600;
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

const QuizTypeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
`;

const QuizTypeLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const QuizTypeTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-content: center;
  align-self: stretch;
`;

const QuizTypeCaption = styled(Label2)`
  padding-top: 3px;
`;

const ArrowRightIcon = styled.img`
  rotate: 180deg;
`;

interface ThisWeekQuizProps {
  iscomplete: boolean;
  /**
   * 지금까지 답한 소개 노트 개수. 완료 여부와 퀴즈 참여 가능 여부를 모두 여기서 판단한다.
   * 조회에 실패해 개수를 모르면 null — 그때는 퀴즈를 막지 않는다.
   */
  introNoteCount: number | null;
  participantCount: number;
}

export function ThisWeekQuiz({ iscomplete, introNoteCount, participantCount }: ThisWeekQuizProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * 결과가 공개되는 목요일까지. 이 카드는 서버가 퀴즈 기간이라고 할 때만 뜨므로 목표일은
   * 기기 요일과 무관하게 항상 목요일이다 — 어드민 '시간 임시 조정'으로 다른 요일에 떠도
   * "결과 공개까지"의 뜻은 같다. 예전에는 기기 요일로 목표를 바꿔 오버라이드가 무시됐다.
   */
  const timeLeft = useTargetDayCountdown(4);
  // 퀴즈 화면의 "새로 풀기"로 돌아온 경우(?quiz=select)에는 종류 선택 시트를 연 채로 시작한다.
  const openedFromRestart = searchParams.get(QUIZ_SELECT_QUERY_KEY) === QUIZ_SELECT_QUERY_VALUE;
  const [isQuizStart, setIsQuizStart] = useState(openedFromRestart);
  const [isIntroNoteAlertOpen, setIsIntroNoteAlertOpen] = useState(false);
  /**
   * 이번 주에 실제로 열린 퀴즈 종류. 시트가 열릴 때 읽는다.
   * null 이면 아직 모르거나 못 읽은 상태 — 그때는 두 종류를 모두 보여 준다(퀴즈 화면이
   * 다시 한번 확인한다). 어드민이 한 종류만 활성화했는데 다른 종류까지 보이면, 그걸 골랐을 때
   * 같은 퀴즈가 다른 이름표를 달고 나왔다(QA 2026-09-09).
   */
  const [availableTypes, setAvailableTypes] = useState<QuizMatchingType[] | null>(null);
  const [typesLoading, setTypesLoading] = useState(false);

  // 시트를 띄웠으면 쿼리는 지운다. 남겨 두면 새로고침·뒤로가기마다 시트가 다시 뜬다.
  useEffect(() => {
    if (!openedFromRestart) return;
    router.replace("/home");
  }, [openedFromRestart, router]);

  useEffect(() => {
    if (!isQuizStart) return;
    let ignore = false;
    setTypesLoading(true);
    getExternalCurrentWeekQuizSets()
      .then(({ quizSets }) => {
        if (ignore) return;
        setAvailableTypes(
          (quizSets ?? [])
            .map((quizSet) => String(quizSet.matchingType))
            .filter((type): type is QuizMatchingType => type === "ONE_TO_ONE" || type === "GROUP"),
        );
      })
      .catch(() => {
        if (!ignore) setAvailableTypes(null);
      })
      .finally(() => {
        if (!ignore) setTypesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isQuizStart]);

  const isTypeAvailable = (type: QuizMatchingType) =>
    availableTypes === null || availableTypes.includes(type);
  const noQuizThisWeek = availableTypes !== null && availableTypes.length === 0;

  const isIntroComplete = introNoteCount === INTRO_NOTE_FIELDS.length;
  /** 온보딩에서 "다음에 할래요"로 건너뛴 사람은 여기서 소개 노트 작성으로 되돌린다. */
  const canStartQuiz =
    introNoteCount === null || introNoteCount >= MIN_INTRO_NOTE_ANSWERS;

  /**
   * 이 카드가 지금 어떤 모습인지. 아래 분기와 **같은 순서**로 판정해야 한다 —
   * 어긋나면 노출은 A 로, 클릭은 B 로 잡혀 클릭률이 통째로 틀어진다.
   */
  const cardState = iscomplete ? "completed" : "open";

  // 클릭률의 분모. 조기 반환보다 위에 있어야 한다 — 훅은 분기 뒤에 둘 수 없다.
  useCardImpression("quiz", cardState);
  const trackClick = (action: string) => trackCardClick("quiz", cardState, action);

  const handleStartQuiz = () => {
    trackClick("start_quiz");
    if (!canStartQuiz) {
      // 소개 노트가 모자라 막힌 클릭. 클릭 자체는 위에서 이미 셌다 —
      // 여기가 크면 "퀴즈를 누르는데 소개 노트에서 막힌다"는 병목이 보인다.
      trackClick("start_quiz_blocked_by_intro_note");
      setIsIntroNoteAlertOpen(true);
      return;
    }
    setIsQuizStart(true);
  };

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
                  결과 공개까지
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
            <FullWidthButtonWrapper>
              <IntroNoteButton
                variant="secondary"
                icon={<img src="/icons/action/note-pen.svg" alt="" />}
                onClick={() => {
                  trackClick("write_intro_note");
                  router.push("/onboarding/intro");
                }}
              >
                소개 노트 작성하기
              </IntroNoteButton>
            </FullWidthButtonWrapper>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <AlertModal
        isOpen={isIntroNoteAlertOpen}
        title="소개 노트를 먼저 작성해주세요"
        message={`퀴즈에 참여하려면 소개 노트를 최소 ${MIN_INTRO_NOTE_ANSWERS}개 이상 작성해야 해요.`}
        confirmParams={{
          text: "작성하러 가기",
          onClick: () => router.push("/onboarding/intro"),
        }}
        cancelParams={{
          text: "닫기",
          onClick: () => setIsIntroNoteAlertOpen(false),
        }}
        onClose={() => setIsIntroNoteAlertOpen(false)}
      />
      {isQuizStart && (
        <BottomSheet
          title="퀴즈의 종류를 선택하세요"
          subTitle="매주 한 종류의 퀴즈만 풀 수 있어요!"
          closer={() => setIsQuizStart(false)}
          detail={
            <QuizTypeList>
              <img src="/assets/illustration/quizstart.svg" loading="lazy" />
              {typesLoading ? null : noQuizThisWeek ? (
                <Label2 $color="var(--color-semantic-label-alternative)" $align="center">
                  이번 주 퀴즈를 준비하고 있어요. 조금만 기다려 주세요!
                </Label2>
              ) : null}
              {!typesLoading && isTypeAvailable("ONE_TO_ONE") && (
              <BottomButton
                onClick={() => {
                  trackClick("select_quiz_type_one_to_one");
                  router.push("/quiz/current?type=ONE_TO_ONE");
                }}
              >
                <QuizTypeLabelRow>
                  <img src="/icons/content/people-red.svg" />
                  <QuizTypeCaption
                    $color="var(--color-semantic-accent-foreground-vintagePink)"
                  >
                    1:1 매칭
                  </QuizTypeCaption>
                </QuizTypeLabelRow>
                <QuizTypeTitleRow>
                  <Heading2Bold>성격, 가치관</Heading2Bold>
                  <ArrowRightIcon src="/icons/navigation/arrow-left.svg" />
                </QuizTypeTitleRow>
                <QuizTypeLabelRow>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    나와 잘 맞는 사람을 찾아봐요.
                  </Label2>
                </QuizTypeLabelRow>
              </BottomButton>
              )}
              {!typesLoading && isTypeAvailable("GROUP") && (
              <BottomButton
                onClick={() => {
                  trackClick("select_quiz_type_group");
                  router.push("/quiz/current?type=GROUP");
                }}
              >
                <QuizTypeLabelRow>
                  <img src="/icons/content/people-green.svg" />
                  <QuizTypeCaption
                    $color="var(--color-atomic-olive-60)"
                  >
                    그룹 매칭
                  </QuizTypeCaption>
                </QuizTypeLabelRow>
                <QuizTypeTitleRow>
                  <Heading2Bold>취미, 취향</Heading2Bold>
                  <ArrowRightIcon src="/icons/navigation/arrow-left.svg" />
                </QuizTypeTitleRow>
                <QuizTypeLabelRow>
                  <Label2 $color="var(--color-semantic-label-alternative)">
                    비슷한 취향의 사람들과 연결돼요.
                  </Label2>
                </QuizTypeLabelRow>
              </BottomButton>
              )}
            </QuizTypeList>
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
            <ActionButton
              onClick={handleStartQuiz}
              icon={<img src="/icons/action/plus.svg" />}
            >
              시작하기
            </ActionButton>
          </ActionContainer>
        }
      />
    </>
  );
}
