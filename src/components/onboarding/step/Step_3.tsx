import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import {
  IntroContainer,
  QuestionContainer
} from "@/components/onboarding/OnboardingContainer";
import { useToast } from "@/context/ToastContext";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";
import type { IntroNoteCode } from "@/features/profile/model/introNotes";
import { Caption1, Label1Normal, TextAreaWithActions } from "@/shared/ui";
import type { TextAreaWithActionsRef } from "@/shared/ui";
import type { ControlButtonVariant, FormData, OnChange } from "@/types/type";

// ✅ 부모에게 노출할 Ref 타입 정의
export interface Step3Ref {
    handleSubmit: () => boolean;
    getCurrentValues: () => string[];
}

interface Step3Props {
    data: FormData;
    onChange: OnChange;
    setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
    onPersist?: (code: IntroNoteCode, value: string) => void;
}

// ✅ forwardRef 적용
export const Step3Intro = forwardRef<Step3Ref, Step3Props>(
  ({ data, onChange, setControlButton, onPersist }, ref) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const { showToast, removeToast } = useToast();
    const textAreaRefs = useRef<(TextAreaWithActionsRef | null)[]>([]);

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

    const questions = INTRO_NOTE_FIELDS.map((q, index) => ({
      ...q,
      index,
    }));

    const completedCount = data.introduce.filter((v) => v.trim().length > 0).length;

    // ✅ 부모에서 호출할 검증 함수
    useImperativeHandle(ref, () => ({
      handleSubmit: () => {
        const ok = completedCount >= 3;
        if (!ok) {
          showToast("최소 3개 이상 작성해주세요.", "error");
        }
        return ok;
      },
      // 저장 여부와 관계없이 현재 입력된 모든 값 반환 (부분 저장용)
      getCurrentValues: () => {
        return questions.map((_, index) => {
          const typed = textAreaRefs.current[index]?.getValue() ?? "";
          return typed.trim().length > 0 ? typed : (data.introduce[index] ?? "");
        });
      },
    }));

    // ✅ 버튼 활성화 조건 (3개 이상 작성 시 활성화)
    useEffect(() => {
      setControlButton(completedCount >= 3 ? "primary" : "disabled");
    }, [completedCount, setControlButton]);

    return (
      <IntroContainer>
        <QuestionProgressCard current={completedCount} total={10} />

        {questions.map((q, index) => {
          const id = `q${index + 1}`;

          return (
            <QuestionContainer key={id}>
              <Label1Normal>{q.question}</Label1Normal>
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
                onSave={(v) => {
                  saveIntroduceAt(index, v);
                  onPersist?.(INTRO_NOTE_FIELDS[index].code, v);
                }}
              />
            </QuestionContainer>
          );
        })}
      </IntroContainer>
    );
  },
);

Step3Intro.displayName = "Step3Intro";


// ... QuestionProgressCard 및 스타일 컴포넌트는 기존과 동일 ...
// (코드 중복 방지를 위해 생략합니다, 기존 코드 그대로 사용하시면 됩니다)
interface QuestionProgressCardProps {
  current: number;
  total: number;
  helperText?: string;
}

const QuestionProgressCard: React.FC<QuestionProgressCardProps> = ({
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
  background-color: var(--color-semantic-background-normal-alternative);
  border-radius: 12px;
  display: flex;
  width: 361px;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;
const HeaderRow = styled.div`
  margin: 0;
`;
const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background-color: var(--color-semantic-background-normal-alternative);
  border-radius: 999px;
  overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%;
  background-color: var(--color-semantic-inverse-background);
  transition: width 0.2s ease;
`;
const HelperText = styled.div`
  p {
    margin: 0;
    font-size: var(--typography-caption-1-font-size);
    color: var(--color-semantic-label-alternative);
  }
`;
