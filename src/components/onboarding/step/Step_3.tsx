import React, {
  forwardRef,
  useCallback,
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
import { useKeyboardInset } from "@/shared/hooks/useKeyboardInset";
import { revealAboveKeyboard } from "@/shared/lib/keyboardViewport";
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
    // 입력창이 실제로 포커스를 쥐고 있는지(≒ 키보드가 떠 있는지).
    const [inputFocused, setInputFocused] = useState(false);
    const { showToast, removeToast } = useToast();
    const textAreaRefs = useRef<(TextAreaWithActionsRef | null)[]>([]);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const blurTimer = useRef<number | null>(null);

    /**
     * 포커스를 잃어도 곧바로 확정하지 않는다.
     * 저장/취소 버튼을 누르면 blur가 먼저 오는데, 그 순간 CTA를 되돌리면 레이아웃이
     * 움직여 클릭이 빗나간다. 한 박자 기다렸다가 정말 포커스가 떠났을 때만 반영한다.
     */
    const handleInputFocusChange = useCallback((focused: boolean) => {
      if (blurTimer.current !== null) {
        window.clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
      if (focused) {
        setInputFocused(true);
        return;
      }
      blurTimer.current = window.setTimeout(() => {
        blurTimer.current = null;
        setInputFocused(false);
      }, 150);
    }, []);

    useEffect(
      () => () => {
        if (blurTimer.current !== null) window.clearTimeout(blurTimer.current);
      },
      [],
    );

    const onRequestFocusChange = (newlyFocusedId: string) => {
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
            actionColor: "var(--color-semantic-inverse-primary)",
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

    /** 지금 편집 중인 질문의 인덱스. 없으면 -1. */
    const activeIndex = questions.findIndex((q) => `q${q.index + 1}` === activeId);
    /**
     * 키보드가 가린 높이. 스크롤 콘텐츠 하단에 이만큼 여백을 줘야 마지막 질문도
     * 키보드 위로 올라온다 — 여백이 없으면 스크롤이 끝에 닿아 가린 채로 남는다.
     */
    const keyboardInset = useKeyboardInset(activeId !== null);

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

    /**
     * 편집 중인 질문을 키보드 위로 끌어올린다.
     *
     * 모바일 브라우저는 키보드를 화면 위에 겹쳐 올릴 뿐 레이아웃 뷰포트를 줄이지 않는다.
     * 그래서 "포커스된 입력창을 보이게 스크롤"하는 브라우저 기본 동작이 여기서는 아무
     * 일도 하지 않는다 — 입력창은 레이아웃상 이미 보이는 자리에 있고 키보드가 그 위를
     * 덮고 있을 뿐이다. Q10처럼 하단에 있는 질문이 키보드에 가린 채로 남는 이유다.
     *
     * 키보드는 애니메이션으로 올라오고 CTA(hideActions)도 같이 사라져 레이아웃이 두세 번
     * 움직인다. 뷰포트 변화를 듣고, 한 박자씩 늦게 몇 번 더 보정한다 — 목표 위치를 매번
     * 다시 계산하므로 여러 번 불려도 같은 자리로 수렴한다.
     */
    useEffect(() => {
      if (activeIndex < 0) return;
      const target = questionRefs.current[activeIndex];
      if (!target) return;

      const reveal = () => revealAboveKeyboard(target);
      const frame = window.requestAnimationFrame(reveal);
      const timers = [200, 450].map((delay) => window.setTimeout(reveal, delay));

      const viewport = window.visualViewport;
      viewport?.addEventListener("resize", reveal);
      window.addEventListener("resize", reveal);

      return () => {
        window.cancelAnimationFrame(frame);
        timers.forEach((timer) => window.clearTimeout(timer));
        viewport?.removeEventListener("resize", reveal);
        window.removeEventListener("resize", reveal);
      };
      // keyboardInset 이 바뀌면 하단 여백이 막 적용된 참이다. 그 여백까지 반영해
      // 한 번 더 끌어올린다 — 마지막 질문은 이 여백이 있어야 끝까지 올라간다.
    }, [activeIndex, keyboardInset]);

    // 키보드가 떠 있는 동안만 부모가 하단 CTA를 감춘다(겹쳐서 입력 영역이 좁아지는 문제).
    // 편집 상태(activeId)에 묶으면 화면 아무 곳이나 눌러 키보드를 내렸을 때 CTA가
    // 돌아오지 않는다 — activeId는 저장/취소로만 풀리기 때문.
    useEffect(() => {
      onEditingChange?.(inputFocused);
    }, [inputFocused, onEditingChange]);

    useEffect(() => {
      if (activeId !== null) return;
      // 저장/취소로 충돌이 풀렸으니 안내 토스트는 스스로 걷는다(이제 자동으로 사라지지 않는다).
      removeToast("save-confirmation");
      // iOS는 키보드가 닫혀도 키보드가 밀어 올렸던 뷰포트 오프셋을 되돌리지 않는 때가 있다.
      // 화면이 아래로 내려가고 위쪽에 빈 영역이 남는 증상이라, 편집이 끝나면 원점으로 돌린다.
      window.scrollTo(0, 0);
    }, [activeId, removeToast]);

    return (
      <IntroContainer $keyboardInset={keyboardInset}>
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
                onFocusChange={handleInputFocusChange}
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
  gap: 10px;
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
