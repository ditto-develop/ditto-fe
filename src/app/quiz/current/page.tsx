"use client";

import { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { Label1Normal, Label2, Title2, Title3 } from "@/components/common/Text";
import Nav from "@/components/display/Nav";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { useRouter } from "next/navigation";
import QuizModal from "@/components/quiz/QuizModal";
import { QuizSetsService, CurrentWeekQuizSetsResponseDto, QuizDto } from "@/lib/api";

// --- Types ---
// QuizData is now inferred from QuizDto

export default function Quiz() {
  const router = useRouter();

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
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await QuizSetsService.quizSetControllerGetCurrentWeek();
        if (response.success && response.data) {
          setQuizData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch quiz data.");
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, []);

  // --- Derived State ---
  const quizzes: QuizDto[] = quizData?.quizSets?.[0]?.quizzes || [];
  const currentQuiz = quizzes[currentStep];
  const isLastQuiz = currentStep === quizzes.length - 1;

  // --- Handlers ---
  const handleChoice = (choiceId: string) => {
    if (selectedChoiceId) return;

    setSelectedChoiceId(choiceId);

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

  // --- Render logic ---
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }

  if (error) {
    return <div>Error: {error}</div>; // Or a proper error component
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
          onRestart={() => router.push('/home')}
          onContinue={() => setIsModal(false)}
        />
      )}
      {isFinish ? (
        <FinishView />
      ) : (
        <div>
          <Nav 
            prev={() => setIsModal(true)} 
            label="1:1 매칭" 
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
        </div>
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

// 전체 컨텐츠(질문+버튼)를 감싸는 래퍼 (페이지 전환 효과)
const FadeWrapper = styled.div<{ $isFadingOut: boolean }>`
  width: 100%;
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
  padding: var(--space-0, 0) 0;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  min-height: 100vh; /* 화면 전체 사용 */
`;

const ProgressBarContiner = styled.div`
  display: flex;
  padding: var(--space-10-px, 10px) var(--space-4, 16px);
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

const ContentContainer = styled.div`
  display: flex;
  height: 250px; /* 높이 고정하여 질문 길이가 달라져도 UI 덜 흔들리게 */
  padding: 0 var(--space-4, 16px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-4, 16px);
  align-self: stretch;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 64px 16px;
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
  background-color: var(--color-semantic-fill-normal, rgba(108, 101, 95, 0.08));
  border-radius: 2px;
  overflow: hidden;
`;

const Fill = styled.div<{ $percentage: number }>`
  width: ${({ $percentage }) => $percentage}%;
  height: 100%;
  background-color: var(--color-semantic-primary-normal, #1A1815); /* Fallback color added */
  border-radius: 2px;
  transition: width 0.3s ease-out;
`;


/** finish area */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 화면 꽉 */
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

function FinishView(){
  const router = useRouter();
  const [imgSrc] = useState(getRandomImage); 

    return(
        <PageContainer>
            <Nav 
                close={()=>{router.push('/home')}}
            />
            <TopContainer>
                <LabelContainer>
                    <img src="/quiz/icons/redpeople.svg" />
                    <Label2 style={{paddingTop: "4px", paddingLeft: "4px"}} $color="var(--color-semantic-accent-foreground-vintagePink)">1:1 매칭</Label2>
                </LabelContainer>
                <LabelContainer>
                  <Title3>퀴즈 참여 완료</Title3>
                  <CircleIconWrapper>
                    <img src="/quiz/icons/v.svg" />
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
                <ActionButton >알림받기</ActionButton>
                <ActionButton 
                  onClick={()=>{router.push('/home')}}
                  variant="tertiary">다음에 하기</ActionButton>
            </ActionSheet>
        </PageContainer>
    )
}