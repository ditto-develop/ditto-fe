"use client";

import { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { Label1Normal, Label2, Title2, Title3 } from "@/components/common/Text";
import Nav from "@/components/display/Nav";
import { ActionButton, ActionSheet } from "@/components/input/Action";
import { useRouter } from "next/navigation";
import QuizModal from "@/components/quiz/QuizModal";

// --- Types ---
interface QuizData {
  id: string;
  question: string;
  choices: { id: string; content: string; order: number }[];
}

export default function Quiz() {
  const router = useRouter();
  
  const dummydata = {
    "success": true,
    "data": {
      "year": 2025,
      "month": 12,
      "week": 1,
      "quizSets": [
        {
          "id": "cuid-set-001",
          "quizzes": [
            {
              "id": "quiz-01",
              "question": "평생 한 종류의 고기만 먹어야 한다면?",
              "choices": [
                { "id": "q1-c1", "content": "돼지고기", "order": 1 },
                { "id": "q1-c2", "content": "소고기", "order": 2 }
              ]
            },
            {
              "id": "quiz-02",
              "question": "더 선호하는 계절은?",
              "choices": [
                { "id": "q2-c1", "content": "여름", "order": 1 },
                { "id": "q2-c2", "content": "겨울", "order": 2 }
              ]
            },
            {
              "id": "quiz-03",
              "question": "탕수육 먹는 스타일은?",
              "choices": [
                { "id": "q3-c1", "content": "부먹 (부어 먹기)", "order": 1 },
                { "id": "q3-c2", "content": "찍먹 (찍어 먹기)", "order": 2 }
              ]
            },
            {
              "id": "quiz-04",
              "question": "휴일에 더 좋아하는 활동은?",
              "choices": [
                { "id": "q4-c1", "content": "집에서 넷플릭스", "order": 1 },
                { "id": "q4-c2", "content": "밖에서 맛집 탐방", "order": 2 }
              ]
            },
            {
              "id": "quiz-05",
              "question": "더 못 참는 상황은?",
              "choices": [
                { "id": "q5-c1", "content": "더운 날 에어컨 고장", "order": 1 },
                { "id": "q5-c2", "content": "추운 날 보일러 고장", "order": 2 }
              ]
            },
            {
              "id": "quiz-06",
              "question": "평생 한 가지 음식만 먹는다면?",
              "choices": [
                { "id": "q6-c1", "content": "피자", "order": 1 },
                { "id": "q6-c2", "content": "치킨", "order": 2 }
              ]
            },
            {
              "id": "quiz-07",
              "question": "다시 태어난다면?",
              "choices": [
                { "id": "q7-c1", "content": "재벌 2세", "order": 1 },
                { "id": "q7-c2", "content": "천재적인 재능 보유", "order": 2 }
              ]
            },
            {
              "id": "quiz-08",
              "question": "여행 스타일은?",
              "choices": [
                { "id": "q8-c1", "content": "계획적인 힐링 여행", "order": 1 },
                { "id": "q8-c2", "content": "즉흥적인 배낭 여행", "order": 2 }
              ]
            },
            {
              "id": "quiz-09",
              "question": "카톡 확인 스타일은?",
              "choices": [
                { "id": "q9-c1", "content": "알림 뜨면 바로 확인", "order": 1 },
                { "id": "q9-c2", "content": "쌓아뒀다 한 번에 확인", "order": 2 }
              ]
            },
            {
              "id": "quiz-10",
              "question": "영화 볼 때 선호하는 장르는?",
              "choices": [
                { "id": "q10-c1", "content": "로맨틱 코미디", "order": 1 },
                { "id": "q10-c2", "content": "액션 스릴러", "order": 2 }
              ]
            },
            {
              "id": "quiz-11",
              "question": "아침 기상 스타일은?",
              "choices": [
                { "id": "q11-c1", "content": "알람 한 번에 기상", "order": 1 },
                { "id": "q11-c2", "content": "5분 간격 스누즈 필수", "order": 2 }
              ]
            },
            {
              "id": "quiz-12",
              "question": "붕어빵 먹는 순서는?",
              "choices": [
                { "id": "q12-c1", "content": "머리부터", "order": 1 },
                { "id": "q12-c2", "content": "꼬리부터", "order": 2 }
              ]
            }
          ]
        }
      ]
    },
    "error": null
  };

  // --- State ---
  const quizzes = dummydata.data.quizSets[0].quizzes;
  const [currentStep, setCurrentStep] = useState(0);
  const [isfinsish, setIsFinish] = useState(false);
  const [isModal, setIsModal] = useState(false);
  
  // 애니메이션 제어용 State
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null); // 선택한 버튼 ID
  const [isFadingOut, setIsFadingOut] = useState(false); // 전체 컨텐츠 퇴장 트리거

  const currentQuiz = quizzes[currentStep];
  const isLastQuiz = currentStep === quizzes.length - 1;

  // --- Handlers ---
  const handleChoice = (choiceId: string) => {
    if (selectedChoiceId) return; // 이미 선택했으면 중복 클릭 방지

    // 1. 선택 상태 활성화 (-> 선택 안 된 버튼 Fade Out 애니메이션 시작)
    setSelectedChoiceId(choiceId);

    // 2. 버튼 애니메이션 시간(400ms) 대기 후, 전체 컨테이너 Fade Out 시작
    setTimeout(() => {
        setIsFadingOut(true);

        // 3. 전체 컨테이너 Fade Out(300ms) 완료 후 데이터 변경 및 초기화
        setTimeout(() => {
            if (!isLastQuiz) {
                setCurrentStep((prev) => prev + 1);
                setSelectedChoiceId(null);
                setIsFadingOut(false);
            } else {
                setIsFinish(true);
                // 결과 페이지 로직
            }
        }, 300); // Container Fade Out Duration

    }, 400); // Button Disappear Duration
  };

  return (
    <>
    {
      isModal && <>
        <QuizModal 
          isOpen={isModal}
          onClose={() => setIsModal(false)}
          onRestart={() => router.push('/home')}
          onContinue={() => setIsModal(false)}
        />
      </>
    }
    {isfinsish ? 
        <FinishView />
    :
    <div>
      <Nav 
        prev={() => {
          setIsModal(true);
        }} 
        label="1:1 매칭" 
      />
      <MainContainer>
        <ProgressBarContiner>
          <ProgressBar current={currentStep + 1} total={quizzes.length} />
        </ProgressBarContiner>

        {/* FadeWrapper: 질문 전환 시 전체 깜빡임(Fade In/Out)을 담당 */}
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
                    variant={index === 1 ? "secondary" : "primary"} // 예시: 짝수/홀수에 따라 스타일 다르게 하거나 고정
                    onClick={() => handleChoice(choice.id)}
                    
                    // Styled-component props
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
    }
    </>
  );
}

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