"use client";

import { useEffect, useState, Suspense } from "react";
import styled, { css, keyframes } from "styled-components";
import { EmptyState, Label1Normal, Label2, Title2, Title3 } from "@/shared/ui";
import { Nav } from "@/shared/ui";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { useRouter, useSearchParams } from "next/navigation";
import { QuizModal, QUIZ_SELECT_HOME_PATH } from "@/components/quiz/QuizModal";
import {
  getExternalCurrentWeekQuizSets,
  getExternalQuizSetWithProgress,
  resetExternalQuizProgress,
  submitExternalQuizAnswer,
} from "@/shared/lib/api/externalApi";
import { getQuizSanctionMessage } from "@/features/sanction";
import { updateNotificationSettings } from "@/features/settings/api/settingsApi";
import { useToast } from "@/context/ToastContext";
import { useBackClose } from "@/shared/hooks/useBackClose";
import { goBackOr } from "@/shared/lib/navigation";
import { registerDeviceToken } from "@/shared/lib/native/pushNotifications";
import type { CurrentWeekQuizSetDto, CurrentWeekQuizSetsResponseDto, QuizDto } from "@/shared/lib/api/generated";

// --- Types ---
// QuizData is now inferred from QuizDto

export default function Quiz() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizContent />
    </Suspense>
  );
}

/**
 * 홈에서 고른 종류(type 쿼리)의 세트만 고른다. **다른 종류로 대체하지 않는다** —
 * 어드민이 그룹 세트만 활성화했을 때 1:1 을 고르면 그룹 퀴즈가 "1:1 매칭" 이름표를 달고
 * 나왔다(QA 2026-09-09). 종류를 지정하지 않고 들어오면 첫 세트다.
 */
function pickQuizSet(
  quizData: CurrentWeekQuizSetsResponseDto,
  matchingType: string | null,
): CurrentWeekQuizSetDto | undefined {
  const quizSets = quizData.quizSets ?? [];
  if (!matchingType) return quizSets[0];
  return quizSets.find((quizSet) => quizSet.matchingType === matchingType);
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const matchingType = searchParams.get("type"); // 'ONE_TO_ONE' | 'GROUP' | null

  // --- State for API data, loading, and error ---
  const [quizData, setQuizData] = useState<CurrentWeekQuizSetsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State for quiz interaction ---
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinish, setIsFinish] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await getExternalCurrentWeekQuizSets();
        if (ignore) return;
        setQuizData(response);

        /*
         * 이어풀기. 이미 답한 문항이 있으면 그 다음 문항에서 시작하고, 이어서 풀지 처음부터
         * 다시 할지 묻는다(Figma 1112:8841). 모두 답했으면 참여 완료 화면이다.
         * 진행 상황을 못 읽으면 처음부터 — 답은 재제출로 덮어써지므로 잃는 것은 없다.
         */
        const quizSet = pickQuizSet(response, matchingType);
        if (!quizSet) return;
        try {
          const progress = await getExternalQuizSetWithProgress(quizSet.id);
          if (ignore) return;
          const answeredIds = new Set(
            progress.quizzes.filter((quiz) => quiz.userAnswer).map((quiz) => quiz.id),
          );
          const quizzes = quizSet.quizzes ?? [];
          const firstUnanswered = quizzes.findIndex((quiz) => !answeredIds.has(quiz.id));
          if (quizzes.length > 0 && firstUnanswered === -1) {
            setIsFinish(true);
          } else if (firstUnanswered > 0) {
            setCurrentStep(firstUnanswered);
            setIsModal(true);
          }
        } catch {
          // 처음부터 시작한다.
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchQuizData();

    return () => {
      ignore = true;
    };
  }, [matchingType]);

  // --- Derived State ---
  const selectedQuizSet = quizData ? pickQuizSet(quizData, matchingType) : undefined;
  // 머리글 태그는 사용자가 홈에서 고른 종류(type 쿼리)를 우선한다.
  const matchingLabel = (matchingType ?? selectedQuizSet?.matchingType) === "GROUP" ? "그룹 매칭" : "1:1 매칭";
  const quizzes: QuizDto[] = selectedQuizSet?.quizzes || [];
  const currentQuiz = quizzes[currentStep];
  const isLastQuiz = currentStep === quizzes.length - 1;

  // --- Handlers ---
  const handleChoice = (choiceId: string) => {
    if (selectedChoiceId || !currentQuiz) return;

    setSelectedChoiceId(choiceId);

    // 서버에 답변 제출 (비동기, 실패해도 UI 진행)
    // 단, 제재(6008)는 답변이 저장되지 않으므로 사용자에게 알린다.
    submitExternalQuizAnswer(currentQuiz.id, choiceId).catch((err: unknown) => {
      const sanctionMessage = getQuizSanctionMessage(err);
      if (sanctionMessage) showToast(sanctionMessage, "error");
    });

    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (!isLastQuiz) {
          setCurrentStep((prev) => prev + 1);
          setSelectedChoiceId(null);
          setIsFadingOut(false);
        } else {
          setIsFinish(true);
        }
      }, 300);
    }, 400);
  };

  /**
   * 뒤로가기 = 이전 문항. 다시 고르면 서버가 그 문항의 답을 덮어쓴다(재제출 허용).
   * 첫 문항에서는 화면을 나간다. 전환 애니메이션 중에는 무시한다 — 예약된 다음 문항 이동과
   * 겹치면 두 칸씩 움직인다.
   */
  const goPrevQuestion = () => {
    if (selectedChoiceId !== null) return;
    if (currentStep === 0) {
      goBackOr(router, "/home");
      return;
    }
    setIsFadingOut(false);
    setCurrentStep((prev) => prev - 1);
  };

  // 안드로이드 하드웨어 뒤로가기도 화면 안 뒤로 버튼과 같게. 첫 문항에서는 원래대로 화면을 나간다.
  useBackClose(!loading && !isFinish && !isModal && currentStep > 0, goPrevQuestion);

  /**
   * "새로 풀기": 이번 주 답변을 지우고 홈의 퀴즈 종류 선택 시트로 간다.
   * 지우지 않으면 어느 종류를 골라도 남은 답변 때문에 이 안내가 다시 뜬다.
   */
  const handleRestart = async () => {
    try {
      await resetExternalQuizProgress();
    } catch {
      showToast("퀴즈를 초기화하지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
      return;
    }
    router.push(QUIZ_SELECT_HOME_PATH);
  };

  // --- Render logic ---
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }

  if (error) {
    return <div>Error: {error}</div>; // Or a proper error component
  }

  // 고른 종류의 세트가 이번 주에 없다. 다른 종류로 바꿔치기하지 않고 그대로 알린다.
  if (matchingType && !selectedQuizSet) {
    return (
      <Page>
        <Nav prev={() => goBackOr(router, "/home")} label={matchingLabel} />
        <EmptySlot>
          <EmptyState
            icon="notification.clock"
            title={`이번 주 ${matchingLabel} 퀴즈가 아직 없어요`}
            description="다른 종류의 퀴즈를 골라 보세요."
          />
        </EmptySlot>
        <ActionSheet>
          <ActionButton onClick={() => router.push(QUIZ_SELECT_HOME_PATH)}>
            다른 퀴즈 고르기
          </ActionButton>
        </ActionSheet>
      </Page>
    );
  }

  if (!currentQuiz) {
    // This can happen if the API returns an empty quizzes array
    return <div>No quiz available at the moment.</div>;
  }

  return (
    <>
      {isModal && (
        <QuizModal
          isOpen={isModal}
          onClose={() => setIsModal(false)}
          onRestart={handleRestart}
          onContinue={() => setIsModal(false)}
        />
      )}
      {isFinish ? (
        <FinishView matchingLabel={matchingLabel} />
      ) : (
        <Page>
          <Nav
            prev={goPrevQuestion}
            label={matchingLabel}
          />
          <MainContainer>
            <ProgressBarContiner>
              <ProgressBar current={currentStep + 1} total={quizzes.length} />
            </ProgressBarContiner>

            <FadeWrapper $isFadingOut={isFadingOut} key={currentQuiz.id}>
              <ContentContainer>
                <Label1Normal $color="var(--color-semantic-status-positive)">
                  질문 {currentStep + 1}
                </Label1Normal>
                <Title2>{currentQuiz.question}</Title2>
              </ContentContainer>

              <ButtonContainer>
                {currentQuiz.choices.map((choice, index) => {
                  const isSelected = selectedChoiceId === choice.id;
                  const isUnselected = selectedChoiceId !== null && !isSelected;

                  return (
                    <AnimActionButton
                      key={choice.id}
                      variant={index === 1 ? "secondary" : "primary"}
                      onClick={() => handleChoice(choice.id!)} // choice.id could be undefined based on DTO
                      $isSelected={isSelected}
                      $isUnselected={isUnselected}
                    >
                      {choice.content}
                    </AnimActionButton>
                  );
                })}
              </ButtonContainer>
            </FadeWrapper>
          </MainContainer>
        </Page>
      )}
    </>
  );
}
// ... (STYLED COMPONENTS remain the same)
/* ------------------------------------------------------
 * STYLED COMPONENTS & ANIMATIONS
 * ------------------------------------------------------ */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
`;

/**
 * 화면을 정확히 뷰포트 높이에 맞춘다(Figma 1029:34704 — 질문은 가운데, 선택지는 맨 아래).
 * 예전에는 본문이 100vh 인 채 그 위에 내비게이션이 더해져 항상 한 화면만큼 더 스크롤됐다.
 */
const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-normal);
`;

const EmptySlot = styled.div`
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// 전체 컨텐츠(질문+버튼)를 감싸는 래퍼 (페이지 전환 효과)
const FadeWrapper = styled.div<{ $isFadingOut: boolean }>`
  width: 100%;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  // 기본적으로 등장할 때 Fade In (key가 바뀌면 재실행됨)
  animation: ${fadeIn} 0.5s ease-out forwards;

  // 다음 질문으로 넘어갈 때 Fade Out
  ${({ $isFadingOut }) =>
    $isFadingOut &&
    css`
      animation: ${fadeOut} 0.3s ease-in forwards;
    `}
`;

// 선택되지 않은 버튼이 사라지는 애니메이션
const AnimActionButton = styled(ActionButton)<{ $isSelected: boolean; $isUnselected: boolean }>`
  transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.2s;

  /* 두 번째 선택지(secondary)는 첫 번째 버튼 배경과 같은 색의 테두리로 한 쌍처럼 보인다. */
  ${({ variant }) =>
    variant === "secondary" &&
    css`
      border-color: var(--color-semantic-primary-normal);
    `}

  ${({ $isUnselected }) =>
    $isUnselected &&
    css`
      opacity: 0; // 선택받지 못하면 사라짐
      pointer-events: none; // 클릭 불가
      transform: scale(0.95);
    `}

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      opacity: 1; // 선택된 것은 유지
      transform: scale(1.02); // 살짝 강조
      z-index: 1;
    `}
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  flex: 1 1 0;
  min-height: 0;
`;

const ProgressBarContiner = styled.div`
  display: flex;
  padding: var(--space-10-px, 10px) var(--space-4, 16px);
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

/* 남는 세로 공간을 모두 차지해 질문을 가운데 둔다. */
const ContentContainer = styled.div`
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  padding: 0 var(--space-4, 16px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-4, 16px);
  align-self: stretch;
  text-align: center;
`;

/* 선택지는 화면 맨 아래. 홈 인디케이터 인셋만큼 더 띄운다. */
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: var(--space-4, 16px) var(--space-4, 16px) calc(var(--space-4, 16px) + env(safe-area-inset-bottom, 0px));
`;

// --- ProgressBar Component (재사용) ---

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <Container>
      <Label1Normal $weight="bold">
        {current}/{total} 질문 완료
      </Label1Normal>
      <Track>
        <Fill $percentage={percentage} />
      </Track>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
`;

const Track = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--color-semantic-fill-normal);
  border-radius: 2px;
  overflow: hidden;
`;

const Fill = styled.div<{ $percentage: number }>`
  width: ${({ $percentage }) => $percentage}%;
  height: 100%;
  background-color: var(--color-semantic-primary-normal); /* Fallback color added */
  border-radius: 2px;
  transition: width 0.3s ease-out;
`;


/** finish area */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh; /* 화면 꽉 */
`;

const TopContainer = styled.div`
    display: flex;
    padding: 0 var(--space-4, 16px);
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    align-self: stretch;
`;

const LabelContainer = styled.div`
    display: flex;
`;

const CircleIconWrapper = styled.div`
  display: flex;
  justify-content: center; /* 가로 중앙 정렬 */
  align-items: center;     /* 세로 중앙 정렬 */

  width: 20px;             /* 원의 지름 (원하는 크기로 조절) */
  height: 20px;
  background-color: black; /* 검정 배경 */
  border-radius: 50%;      /* 완전한 원 */

  margin-top: 3px;
  margin-left: 8px;
`;

export const RandomImg = styled.img`
  width: 280px;
  height: 280px;
  aspect-ratio: 1/1;
`;

const MiddleContainer = styled.div`
  display: flex;
  padding: 0 var(--space-4, 16px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-4, 16px);
  flex: 1 0 0;
  align-self: stretch;
`;

const getRandomImage = () => {
  const num = Math.floor(Math.random() * 10) + 1;
  return `/quiz/img/${num}.svg`;
};

function FinishView({ matchingLabel }: { matchingLabel: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [imgSrc] = useState(getRandomImage);
  const [notifying, setNotifying] = useState(false);
  const isGroup = matchingLabel === "그룹 매칭";

  /**
   * "알림받기": 매칭 알림을 켜고(설정 화면의 토글과 같은 값) 홈으로 돌아간다.
   * 앱이면 이 기기의 푸시 토큰도 함께 등록해 둔다 — 웹에서는 아무 일도 하지 않는다.
   * 예전에는 아무 동작도 없는 버튼이었다(QA 2026-09-09).
   */
  const handleNotify = async () => {
    if (notifying) return;
    setNotifying(true);
    try {
      await updateNotificationSettings({ matching: true });
      void registerDeviceToken();
      showToast("매칭 결과가 나오면 알려드릴게요.", "success");
      router.push("/home");
    } catch {
      showToast("알림 설정에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setNotifying(false);
    }
  };

    return(
        <PageContainer>
            <Nav
                close={()=>{router.push('/home')}}
            />
            <TopContainer>
                <LabelContainer>
                    <img
                      src={isGroup ? "/icons/content/people-green.svg" : "/icons/content/people-red.svg"}
                      alt=""
                    />
                    <Label2
                      style={{paddingTop: "4px", paddingLeft: "4px"}}
                      $color={isGroup
                        ? "var(--color-atomic-olive-60)"
                        : "var(--color-semantic-accent-foreground-vintagePink)"}
                    >
                      {matchingLabel}
                    </Label2>
                </LabelContainer>
                <LabelContainer>
                  <Title3>퀴즈 참여 완료</Title3>
                  <CircleIconWrapper>
                    <img src="/icons/status/check.svg" alt="" />
                  </CircleIconWrapper>
                </LabelContainer>
                <div>
                  <Label1Normal>목요일에 매칭 결과가 공개돼요.</Label1Normal>
                  <Label1Normal>나와 같은 선택을 한 사람을 만날 수 있어요.</Label1Normal>
                  <Label1Normal>조금만 기다려주세요!</Label1Normal>
                </div>
            </TopContainer>

            <MiddleContainer>
              <RandomImg src={imgSrc} />
            </MiddleContainer>

            <ActionSheet
                caption="결과를 놓치지 않도록 알려드릴게요"
                layout="column"
            >
                <ActionButton
                  variant={notifying ? "disabled" : "primary"}
                  disabled={notifying}
                  onClick={handleNotify}
                >
                  알림받기
                </ActionButton>
                <ActionButton
                  onClick={()=>{router.push('/home')}}
                  variant="tertiary">다음에 하기</ActionButton>
            </ActionSheet>
        </PageContainer>
    )
}
