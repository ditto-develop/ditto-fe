import {
  useToast
} from "@/context/ToastContext";
import { ControlButtonVariant, FormData, OnChange } from "@/types/type";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import {
  Caption1,
  Label1Normal
} from "@/components/common/Text";
import {
  TextAreaWithActions,
  TextAreaWithActionsRef,
} from "@/components/input/TextArea";
import {
  IntroContainer,
  QuestionContainer
} from "@/components/onboarding/OnboardingContainer";

// ✅ 부모에게 노출할 Ref 타입 정의
export interface Step3Ref {
  handleSubmit: () => boolean;
}

interface Step3Props {
  data: FormData;
  onChange: OnChange;
  setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
}

// ✅ forwardRef 적용
export const Step3Intro = forwardRef < Step3Ref, Step3Props > (
  ({
    data,
    onChange,
    setControlButton
  }, ref) => {
    const [activeId, setActiveId] = useState < string | null > (null);
    const {
      showToast,
      removeToast
    } = useToast();
    const textAreaRefs = useRef < (TextAreaWithActionsRef | null)[] > ([]);

    const onRequestFocusChange = (newlyFocusedId: string) => {
      const activeIndex = questions.findIndex(
        (q) => `q${q.index + 1}` === activeId
      );

      if (activeId && activeId !== newlyFocusedId) {
        showToast(
          "작성 중인 다른 답변이 있어요. 저장 또는 취소 후 이동해 주세요.",
          "default",
          {
            id: "save-confirmation",
            actionLabel: "저장",
            onAction: () => {
              const success = textAreaRefs.current[activeIndex]?.save();
              if (success) {
                setActiveId(newlyFocusedId);
                removeToast("save-confirmation");
              }
            },
          }
        );
      } else {
        setActiveId(newlyFocusedId);
      }
    };

    const saveIntroduceAt = (index: number, value: string) => {
      // 배열 불변성 유지하며 업데이트
      const newIntroduce = [...data.introduce];
      newIntroduce[index] = value;
      onChange("introduce", newIntroduce);
    };

    const questions = [{
      title: "Q1. 여행갈 때 꼭 챙겨야 하는 3가지는?",
      placeholder: "예: 이어폰, 선크림, 카메라",
    }, {
      title: "Q2. 주말 아침 10시, 나는 주로 뭐하고 있을까?",
      placeholder: "예: 침대에서 유튜브 보기, 동네 카페에서 브런치, 운동",
    }, {
      title: "Q3. 친구들이 나한테 제일 많이 하는 말은?",
      placeholder: "예: 너 진짜 느긋하다, 웃긴다, 계획적이다",
    }, {
      title: "Q4. 스트레스 받을 때 나만의 해소법은?",
      placeholder: "예: 혼자 드라이브, 친구 만나서 수다, 집에서 영화 정주행",
    }, {
      title: "Q5. 최근 1년 내 가장 잘한 선택은?",
      placeholder: "예: 퇴사하고 이직한 것, 운동 시작한 것, 반려동물 입양",
    }, {
      title: "Q6. 나를 가장 행복하게 만드는 순간은?",
      placeholder: "예: 맛집 찾았을 때, 좋아하는 음악 들을 때, 친구들이랑 놀 때",
    }, {
      title: "Q7. 요즘 내가 가장 많이 쓰는 앱 3개는?",
      placeholder: "예:유튜브, 인스타그램, 배달의민족",
    }, {
      title: "Q8. 하루 중 가장 좋아하는 시간대는? 그때 주로 뭐해?",
      placeholder: "예: 저녁 9시, 하루 마무리하며 책 읽기",
    }, {
      title: "Q9. 내가 절대 양보 못하는 것은?",
      placeholder: "예: 잠자는 시간, 주말 중 하루는 쉬기, 커피",
    }, {
      title: "Q10. 나를 한 단어로 표현한다면?",
      placeholder: "예: 느긋한, 계획적인, 호기심 많은, 털털한",
    }, ].map((q, index) => ({ ...q,
      index
    }));

  const completedCount = data.introduce.filter((v) => v.trim().length > 0).length;

  // ✅ 부모에서 호출할 검증 함수
  useImperativeHandle(ref, () => ({
    handleSubmit: () => {
      // 10개 질문이 모두 채워져 있는지 확인
      const isAllFilled = 
        data.introduce.length === 10 &&
        data.introduce.every(v => v.trim() !== "");
      if(!isAllFilled){
          showToast("빈칸을 완성해주세요.", "error");
      }
      
      return isAllFilled;
    }
  }));

  // ✅ 버튼 활성화 조건 (시각적 처리)
  useEffect(() => {
    const ok =
      data.introduce.length === 10 &&
      data.introduce.every(v => v.trim() !== "");

    setControlButton(ok ? "primary" : "disabled");
  }, [data.introduce, setControlButton]);


  return (
    <IntroContainer>
      <QuestionProgressCard current={completedCount} total={10} />

      {questions.map((q, index) => {
        const id = `q${index + 1}`;

        return (
          <QuestionContainer key={id}>
            <Label1Normal>{q.title}</Label1Normal>
            <TextAreaWithActions
              ref={(el) => {
                textAreaRefs.current[index] = el;
              }}
              id={id}
              initialValue={data.introduce[index] ?? ""}
              placeholder={q.placeholder}
              activeId={activeId}
              onChangeActive={setActiveId}
              onRequestFocusChange={onRequestFocusChange}
              onSave={(v) => saveIntroduceAt(index, v)}
            />
          </QuestionContainer>
        );
      })}
    </IntroContainer>
  );
});

Step3Intro.displayName = "Step3Intro";


// ... QuestionProgressCard 및 스타일 컴포넌트는 기존과 동일 ...
// (코드 중복 방지를 위해 생략합니다, 기존 코드 그대로 사용하시면 됩니다)
interface QuestionProgressCardProps {
    current: number;
    total: number;
    helperText?: string;
}

export const QuestionProgressCard: React.FC<QuestionProgressCardProps> = ({
    current,
    total,
    helperText = "최소 3개 이상 작성해주세요",
}) => {
    const clampedCurrent = Math.min(Math.max(current, 0), total);
    const percent = total > 0 ? (clampedCurrent / total) * 100 : 0;
  
    return (
      <CardWrapper>
        <HeaderRow>
          <Label1Normal>
            {clampedCurrent}/{total} 질문 완료
          </Label1Normal>
        </HeaderRow>
  
        <ProgressTrack>
          <ProgressFill style={{ width: `${percent}%` }} />
        </ProgressTrack>
  
        <HelperText>
          <Caption1>{helperText}</Caption1>
        </HelperText>
      </CardWrapper>
    );
};

const CardWrapper = styled.div`
  background-color: var(--Background-Normal-Alternative, #DDD8D3);
  border-radius: 12px;
  display: flex;
  width: 361px;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;
const HeaderRow = styled.div` margin: 0; `;
const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background-color: #d3cec7; 
  border-radius: 999px;
  overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%;
  background-color: #26211c; 
  transition: width 0.2s ease;
`;
const HelperText = styled.div`
  p { margin: 0; font-size: 12px; color: #7a736b; }
`;