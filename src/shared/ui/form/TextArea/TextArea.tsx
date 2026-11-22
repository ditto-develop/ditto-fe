import React, { useState, forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import styled from "styled-components";

interface TextAreaWithActionsProps {
  id: string; // 각 컴포넌트 고유 ID
  maxLength?: number;
  initialValue?: string;
  placeholder?: string;
  /** 바깥(폼 검증)에서 이 항목을 오류로 표시하고 싶을 때 테두리를 강조한다. */
  invalid?: boolean;

  activeId: string | null; // 현재 편집 중인 ID (부모에서 관리)
  /** 이 항목을 편집 상태로 바꿔 달라고 부모에 알린다(입력창에 포커스가 오거나 저장된 답을 눌렀을 때). */
  onRequestFocusChange: (id: string) => void;
  /**
   * 입력창이 실제로 포커스를 얻고 잃을 때 알린다(≒ 키보드가 열리고 닫힐 때).
   * 편집 상태(activeId)는 부모가 이 신호를 보고 거둔다.
   */
  onFocusChange?: (focused: boolean) => void;

  /** 포커스를 잃을 때 바뀐 값이 있으면 그 값으로 부른다. 지운 답은 빈 문자열로 온다. */
  onSave?: (value: string) => void;
}

export interface TextAreaWithActionsRef {
  getValue: () => string;
  /** 입력창에서 포커스를 거둔다(키보드를 닫는다). 포커스가 있었다면 그 값이 저장된다. */
  blur: () => void;
}

/**
 * 소개 노트 답변 입력창. 저장/취소 버튼 없이 포커스를 잃는 순간 저장한다.
 *
 * 예전에는 답마다 저장/취소를 눌러야 했고, 쓰던 답을 저장하지 않으면 다른 칸으로 옮겨 가지도
 * 못하게 막았다(토스트로 "저장 또는 취소 후 이동"). 다른 칸을 누를 때마다 걸리는 게
 * 불편하다는 QA(2026-11-16 "꼭 저장을 눌러야 할 필요가 있을까?")로, 다른 곳을 누르거나
 * 키보드를 내리면 쓴 그대로 저장되게 바꿨다.
 */
export const TextAreaWithActions = forwardRef<
  TextAreaWithActionsRef,
  TextAreaWithActionsProps
>(
  (
    {
      id,
      maxLength = 100,
      initialValue = "",
      placeholder = "",
      invalid = false,
      activeId,
      onSave,
      onRequestFocusChange,
      onFocusChange,
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue);
    const [savedValue, setSavedValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isActive = activeId === id;
    const isSaved = savedValue.length > 0;

    /**
     * 쓴 값을 저장된 값으로 확정한다. 바뀐 게 없으면 아무것도 하지 않는다.
     * 공백만 남은 답은 빈 답으로 본다 — 그대로 두면 내용 없는 칸이 저장된 것처럼 보인다.
     */
    const commit = () => {
      const next = value.trim().length === 0 ? "" : value;
      if (next !== value) setValue(next);
      if (next === savedValue) return;
      setSavedValue(next);
      onSave?.(next);
    };

    const handleFocus = () => {
      onFocusChange?.(true);
      onRequestFocusChange(id);
    };

    const handleBlur = () => {
      commit();
      onFocusChange?.(false);
    };

    /**
     * 편집 상태로 바뀌면 입력창에 포커스를 준다.
     *
     * 저장된 답변은 <p>(SavedText)로 그려 두었다가 누르는 순간 textarea 로 교체된다.
     * 그래서 브라우저가 알아서 주는 포커스가 없다 — 그냥 두면 한 번 눌러서는 커서도
     * 키보드도 오지 않고, 두 번 눌러야 입력이 시작됐다.
     *
     * useEffect 가 아니라 useLayoutEffect 인 이유: iOS 는 사용자 제스처 안에서 부른
     * focus() 만 키보드를 띄운다. 레이아웃 이펙트는 클릭을 처리한 것과 같은 호출 스택에서
     * 실행되므로 제스처 컨텍스트가 살아 있다.
     */
    useLayoutEffect(() => {
      if (!isActive) return;
      const textarea = textareaRef.current;
      if (!textarea || document.activeElement === textarea) return;
      textarea.focus();
      // 커서는 이미 쓴 글 끝에 둔다. 맨 앞이면 이어 쓰려다 앞을 지운다.
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    }, [isActive]);

    useImperativeHandle(ref, () => ({
      getValue: () => value,
      blur: () => textareaRef.current?.blur(),
    }));

    const handleSavedClick = () => {
      onRequestFocusChange(id);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    };

    return (
      <Container>
        <Wrapper $error={invalid}>
          {isSaved && !isActive ? (
            <SavedText onClick={handleSavedClick}>{savedValue}</SavedText>
          ) : (
            /*
             * 입력창 높이는 내용(비어 있으면 예시 문구)의 줄 수를 따라간다.
             * 같은 글꼴로 같은 글을 그린 가상 요소를 뒤에 겹쳐 두고 그 높이를 빌려 쓴다 —
             * scrollHeight 를 재는 방식은 예시 문구가 여러 줄일 때 브라우저마다 다르게 잰다.
             */
            <GrowWrap data-replicated-value={value || placeholder}>
              <StyledTextarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                maxLength={maxLength}
              />
            </GrowWrap>
          )}

          {isActive ? (
            <FooterRow>
              <p>
                {value.length}/{maxLength}
              </p>
            </FooterRow>
          ) : (
            isSaved && (
              <SavedFooterRow>
                <SavedEmoji src="/icons/status/textfield-success.svg" alt="saved" />
              </SavedFooterRow>
            )
          )}
        </Wrapper>
      </Container>
    );
  }
);

TextAreaWithActions.displayName = "TextAreaWithActions";

// -------------------------------
// Styled Components
// -------------------------------

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
const Wrapper = styled.div<{ $error?: boolean }>`
  padding: 12px;
  border-radius: 16px;
  border: 2px solid
    ${({ $error }) =>
      $error
        ? "var(--color-semantic-status-negative)"
        : "var(--color-semantic-line-normal-normal)"};
  background: var(--color-semantic-background-normal-normal);
`;

/**
 * 자동 높이 입력창.
 * textarea 와 가상 요소(::after)를 같은 그리드 칸에 겹친다. 가상 요소가 실제 글(또는 예시
 * 문구)을 같은 글꼴·줄간격·폭으로 그려 칸 높이를 만들고, textarea 는 그 높이를 그대로 쓴다.
 * 그래서 한 줄이면 한 줄 높이, 두 줄로 넘어가면 두 줄 높이가 된다.
 */
const GrowWrap = styled.div`
  display: grid;
  width: 100%;

  &::after {
    content: attr(data-replicated-value) " ";
    white-space: pre-wrap;
    visibility: hidden;
    pointer-events: none;
  }

  &::after,
  & > textarea {
    grid-area: 1 / 1 / 2 / 2;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    margin: 0;
    /* 좌우 여백은 바깥 Wrapper 가 준다. 여기서 더 주면 양쪽이 달라 보인다. */
    padding: 0;
    border: none;
    font-family: inherit;
    font-size: var(--typography-body-1-normal-font-size);
    font-weight: var(--typography-body-1-normal-font-weight);
    line-height: var(--typography-body-1-normal-line-height);
    letter-spacing: var(--typography-body-1-normal-letter-spacing);
    overflow-wrap: break-word;
  }
`;

const StyledTextarea = styled.textarea`
  display: block;
  outline: none;
  resize: none;
  overflow: hidden;
  background: transparent;
  color: inherit;

  &::placeholder {
    color: var(--color-semantic-label-alternative);
  }
`;

const SavedText = styled.p`
  font-size: var(--typography-body-1-normal-font-size);
  margin: 0;
  padding: 4px 0;
  cursor: pointer;
`;

const FooterRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    margin: 0;
    font-size: var(--typography-label-2-font-size);
    color: var(--color-semantic-label-alternative);
  }
`;

const SavedFooterRow = styled(FooterRow)`
  justify-content: flex-end;
`;

const SavedEmoji = styled.img`
  width: 20px;
  height: 20px;
`;
