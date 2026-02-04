import React, { useState, forwardRef, useImperativeHandle } from "react";
import styled from "styled-components";
import { Caption1 } from "../common/Text";

interface TextAreaWithActionsProps {
  id: string; // 각 컴포넌트 고유 ID
  maxLength?: number;
  minLength?: number;
  initialValue?: string;
  placeholder?: string;

  activeId: string | null; // 현재 편집 중인 ID (부모에서 관리)
  onChangeActive: (id: string | null) => void;
  onRequestFocusChange: (id: string) => void;

  onSave?: (value: string) => void;
  onCancel?: () => void;
}

export interface TextAreaWithActionsRef {
  save: () => boolean;
}

export const TextAreaWithActions = forwardRef<
  TextAreaWithActionsRef,
  TextAreaWithActionsProps
>(
  (
    {
      id,
      maxLength = 100,
      minLength = 10,
      initialValue = "",
      placeholder = "",
      activeId,
      onChangeActive,
      onSave,
      onCancel,
      onRequestFocusChange,
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue);
    const [savedValue, setSavedValue] = useState(initialValue);
    const [error, setError] = useState<string | null>(null);

    const isActive = activeId === id;
    const isSaved = savedValue.length > 0;

    const handleFocus = () => {
      onRequestFocusChange(id);
    };

    const handleSave = (): boolean => {
      if (value.length < minLength) {
        setError(`10자 이상 작성해주세요`);
        return false;
      }
      setError(null);
      setSavedValue(value);
      onChangeActive(null);
      onSave?.(value);
      return true;
    };

    useImperativeHandle(ref, () => ({
      save: handleSave,
    }));

    const handleCancel = () => {
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
        if (error && e.target.value.length >= minLength) {
          setError(null);
        }
      }
    };

    return (
      <Container>
        <Wrapper $error={!!error}>
          {isSaved && !isActive ? (
            <SavedText onClick={handleSavedClick}>{savedValue}</SavedText>
          ) : (
            <StyledTextarea
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              placeholder={placeholder}
              maxLength={maxLength}
              readOnly={activeId !== null && !isActive}
            />
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
                {error && <SavedEmoji src="/textfield/error.svg" alt="error" />}
              </ActionGroup>
            </FooterRow>
          ) : (
            isSaved && (
              <FooterRow>
                <p>
                  {savedValue.length}/{maxLength} (최소 {minLength}자 이상)
                </p>
                <SavedEmoji src="/textfield/success.svg" alt="saved" />
              </FooterRow>
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
  padding: 16px;
  border-radius: 16px;
  border: 2px solid
    ${({ $error }) =>
      $error
        ? "var(--color-semantic-status-negative)"
        : "var(--color-semantic-line-normal-normal)"};
  background: var(--color-semantic-background-normal-normal);
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  height: 52px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: 16px;
  line-height: 1.4;

  &::placeholder {
    color: var(--color-semantic-label-alternative);
  }
`;

const SavedText = styled.p`
  font-size: 16px;
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
    font-size: 13px;
    color: var(--color-semantic-label-alternative);
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  button {
    border: none;
    background: none;
    font-size: 15px;
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
