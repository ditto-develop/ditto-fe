import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import styled from "styled-components";
import { Caption1 } from "@/shared/ui";

interface TextAreaWithActionsProps {
  id: string; // 각 컴포넌트 고유 ID
  maxLength?: number;
  minLength?: number;
  initialValue?: string;
  placeholder?: string;
  /** 바깥(폼 검증)에서 이 항목을 오류로 표시하고 싶을 때. 내부 error와 별개로 테두리를 강조한다. */
  invalid?: boolean;

  activeId: string | null; // 현재 편집 중인 ID (부모에서 관리)
  onChangeActive: (id: string | null) => void;
  onRequestFocusChange: (id: string) => void;
  /**
   * 입력창이 실제로 포커스를 얻고 잃을 때 알린다(≒ 키보드가 열리고 닫힐 때).
   * 편집 상태(activeId)와 달리 화면 아무 곳이나 눌러 포커스를 잃으면 곧바로 false가 된다.
   */
  onFocusChange?: (focused: boolean) => void;

  onSave?: (value: string) => void;
  onCancel?: () => void;
}

export interface TextAreaWithActionsRef {
  save: () => boolean;
  getValue: () => string;
  /** 편집 중인 입력에서 포커스를 정상적으로 거둔다(키보드를 닫는다). */
  blur: () => void;
}

export const TextAreaWithActions = forwardRef<
  TextAreaWithActionsRef,
  TextAreaWithActionsProps
>(
  (
    {
      id,
      maxLength = 100,
      // 최소 글자 수 제한은 없앴다(2026-09-08). 짧은 답변도 그대로 저장된다.
      // 빈 답변만 막는다 — 저장할 내용이 없기 때문.
      minLength = 0,
      initialValue = "",
      placeholder = "",
      invalid = false,
      activeId,
      onChangeActive,
      onSave,
      onCancel,
      onRequestFocusChange,
      onFocusChange,
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue);
    const [savedValue, setSavedValue] = useState(initialValue);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isActive = activeId === id;
    const isSaved = savedValue.length > 0;
    /** 다른 답변을 편집 중이라 지금은 손댈 수 없는 상태. */
    const isLocked = activeId !== null && !isActive;

    const handleFocus = () => {
      onFocusChange?.(true);
      onRequestFocusChange(id);
    };

    const handleBlur = () => {
      onFocusChange?.(false);
    };

    /**
     * 편집 중인 다른 답변이 있을 때는 포커스 자체를 옮기지 않는다.
     *
     * readOnly 텍스트필드로 포커스가 튀면 iOS가 키보드를 blur 없이 내리는데,
     * 이때 키보드 때문에 밀어 올렸던 뷰포트 오프셋이 복구되지 않는다.
     * 화면이 통째로 아래로 내려가고 위쪽에 빈(검은) 영역이 남는 증상이 이것이다.
     */
    const handlePointerDown = (event: React.PointerEvent<HTMLTextAreaElement>) => {
      if (!isLocked) return;
      event.preventDefault();
      onRequestFocusChange(id);
    };

    const handleSave = (): boolean => {
      if (value.trim().length === 0) {
        setError("내용을 입력해주세요");
        return false;
      }
      if (value.length < minLength) {
        setError(`${minLength}자 이상 작성해주세요`);
        return false;
      }
      // 저장하면 이 textarea는 SavedText로 교체된다. 포커스가 남은 채로 사라지면
      // iOS에서 키보드가 비정상 종료되므로, 사라지기 전에 먼저 포커스를 거둔다.
      textareaRef.current?.blur();
      setError(null);
      setSavedValue(value);
      onChangeActive(null);
      onSave?.(value);
      return true;
    };

    useImperativeHandle(ref, () => ({
      save: handleSave,
      getValue: () => value,
      blur: () => textareaRef.current?.blur(),
    }));

    const handleCancel = () => {
      textareaRef.current?.blur();
      setValue(savedValue || initialValue);
      setError(null);
      onChangeActive(null);
      onCancel?.();
    };

    const handleSavedClick = () => {
      onRequestFocusChange(id);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isActive) {
        setValue(e.target.value);
        if (
          error &&
          e.target.value.trim().length > 0 &&
          e.target.value.length >= minLength
        ) {
          setError(null);
        }
      }
    };

    return (
      <Container>
        <Wrapper $error={!!error || invalid}>
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
                onPointerDown={handlePointerDown}
                placeholder={placeholder}
                maxLength={maxLength}
                readOnly={isLocked}
              />
            </GrowWrap>
          )}

          {isActive ? (
            <FooterRow>
              <p>
                {value.length}/{maxLength}
              </p>

              <ActionGroup>
                <button className="cancel" onClick={handleCancel}>
                  취소
                </button>
                <button className="save" onClick={handleSave}>
                  저장
                </button>
                {error && <SavedEmoji src="/icons/status/textfield-error.svg" alt="error" />}
              </ActionGroup>
            </FooterRow>
          ) : (
            isSaved && (
              <SavedFooterRow>
                <SavedEmoji src="/icons/status/textfield-success.svg" alt="saved" />
              </SavedFooterRow>
            )
          )}
        </Wrapper>
        {error && <Caption1 style={{paddingTop: "8px"}} $color="var(--color-semantic-status-negative)">{error}</Caption1>}
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

const ActionGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  button {
    border: none;
    background: none;
    font-size: var(--typography-body-2-normal-font-size);
    cursor: pointer;
    padding: 4px 0;
  }

  .cancel {
    color: var(--color-semantic-label-alternative);
  }

  .save {
    color: var(--color-semantic-label-normal);
    font-weight: 600;
  }

  .save:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const SavedEmoji = styled.img`
  width: 20px;
  height: 20px;
`;
