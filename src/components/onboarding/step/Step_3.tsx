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
import { INTRO_NOTE_FIELDS, MIN_INTRO_NOTE_ANSWERS } from "@/features/profile/model/introNotes";
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
    /** 답변을 편집 중인지 알린다. 편집 중에는 화면이 좁아 하단 CTA를 감추기 위한 신호. */
    onEditingChange?: (isEditing: boolean) => void;
}

// ✅ forwardRef 적용
export const Step3Intro = forwardRef<Step3Ref, Step3Props>(
  ({ data, onChange, setControlButton, onPersist, onEditingChange }, ref) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    // "다 작성했어요"를 눌렀는데 필수 질문이 비어 있을 때만 켠다.
    const [showRequiredHint, setShowRequiredHint] = useState(false);
    const { showToast, removeToast } = useToast();
    const textAreaRefs = useRef<(TextAreaWithActionsRef | null)[]>([]);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const onRequestFocusChange = (newlyFocusedId: string) => {
      const activeIndex = questions.findIndex(
        (q) => `q${q.index + 1}` === activeId
      );

      if (activeId && activeId !== newlyFocusedId) {
        // 편집 중인 입력에서 포커스를 정상적으로 거둔다.
        // 키보드가 닫혀야 화면 하단 고정 토스트가 가리지 않고, iOS에서 뷰포트가 밀린 채
        // 남지 않는다.
        textAreaRefs.current[activeIndex]?.blur();
        showToast(
          "작성 중인 다른 답변이 있어요. 저장 또는 취소 후 이동해 주세요.",
          "default",
          {
            id: "save-confirmation",
            actionLabel: "저장",
            // 액션(저장)이나 닫기를 누를 때까지 떠 있어야 한다. 자동으로 사라지면
            // 왜 다른 답변으로 넘어가지 않는지 알 수 없다.
            duration: 0,
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
    /**
     * 답이 비어 있는 첫 필수 질문(현재는 Q10 하나뿐).
     * -1이면 필수 질문이 모두 채워진 상태다 — 개수를 아무리 채워도 이게 남아 있으면
     * "다 작성했어요"는 활성화되지 않는다.
     */
    const missingRequiredIndex = questions.findIndex(
      (question) =>
        question.required && (data.introduce[question.index] ?? "").trim().length === 0,
    );
    const requiredAnswered = missingRequiredIndex === -1;
    const canSubmit = completedCount >= MIN_INTRO_NOTE_ANSWERS && requiredAnswered;

    // ✅ 부모에서 호출할 검증 함수
    useImperativeHandle(ref, () => ({
      handleSubmit: () => {
        if (!requiredAnswered) {
          // 토스트만으로는 어느 질문이 문제인지 알 수 없다. 해당 질문을 화면에 띄우고 강조한다.
          setShowRequiredHint(true);
          questionRefs.current[missingRequiredIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          showToast("필수 질문에 답해 주세요.", "error");
        } else if (completedCount < MIN_INTRO_NOTE_ANSWERS) {
          showToast(`최소 ${MIN_INTRO_NOTE_ANSWERS}개 이상 작성해주세요.`, "error");
        }
        return canSubmit;
      },
      // 저장 여부와 관계없이 현재 입력된 모든 값 반환 (부분 저장용)
      getCurrentValues: () => {
        return questions.map((_, index) => {
          const typed = textAreaRefs.current[index]?.getValue() ?? "";
          return typed.trim().length > 0 ? typed : (data.introduce[index] ?? "");
        });
      },
    }));

    // ✅ 버튼 활성화 조건 (3개 이상 및 필수 질문 작성 시 활성화)
    useEffect(() => {
      setControlButton(canSubmit ? "primary" : "disabled");
    }, [canSubmit, setControlButton]);

    // 필수 질문이 채워지면 강조는 스스로 걷힌다.
    useEffect(() => {
      if (requiredAnswered) setShowRequiredHint(false);
    }, [requiredAnswered]);

    // 편집 중에는 부모가 하단 CTA를 감춘다(키보드와 겹쳐 입력 영역이 좁아지는 문제).
    useEffect(() => {
      onEditingChange?.(activeId !== null);
    }, [activeId, onEditingChange]);

    useEffect(() => {
      if (activeId !== null) return;
      // 저장/취소로 충돌이 풀렸으니 안내 토스트는 스스로 걷는다(이제 자동으로 사라지지 않는다).
      removeToast("save-confirmation");
      // iOS는 키보드가 닫혀도 키보드가 밀어 올렸던 뷰포트 오프셋을 되돌리지 않는 때가 있다.
      // 화면이 아래로 내려가고 위쪽에 빈 영역이 남는 증상이라, 편집이 끝나면 원점으로 돌린다.
      window.scrollTo(0, 0);
    }, [activeId, removeToast]);

    return (
      <IntroContainer>
        <QuestionProgressCard current={completedCount} total={10} />

        {questions.map((q, index) => {
          const id = `q${index + 1}`;
          const highlightRequired = showRequiredHint && index === missingRequiredIndex;

          return (
            <QuestionContainer
              key={id}
              ref={(el) => {
                questionRefs.current[index] = el;
              }}
            >
              <Label1Normal
                $color={
                  highlightRequired
                    ? "var(--color-semantic-status-negative)"
                    : undefined
                }
              >
                {q.question}
                {q.required && <Required> *</Required>}
              </Label1Normal>
              <TextAreaWithActions
                ref={(el) => {
                  textAreaRefs.current[index] = el;
                }}
                id={id}
                initialValue={data.introduce[index] ?? ""}
                placeholder={q.placeholder}
                invalid={highlightRequired}
                activeId={activeId}
                onChangeActive={setActiveId}
                onRequestFocusChange={onRequestFocusChange}
                onSave={(v) => {
                  saveIntroduceAt(index, v);
                  onPersist?.(INTRO_NOTE_FIELDS[index].code, v);
                }}
              />
              {highlightRequired && (
                <Caption1 $color="var(--color-semantic-status-negative)">
                  필수 질문이에요. 이 질문에 답해야 완료할 수 있어요.
                </Caption1>
              )}
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
  helperText = `최소 ${MIN_INTRO_NOTE_ANSWERS}개 이상, 필수 질문 포함`,
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

const Required = styled.span`
  color: var(--color-semantic-status-negative);
`;
