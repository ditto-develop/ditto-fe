import React, { useState } from "react";
import styled from "styled-components";

interface TextAreaWithActionsProps {
  id: string;                          // 각 컴포넌트 고유 ID
  maxLength?: number;
  minLength?: number;
  initialValue?: string;
  placeholder?: string;

  activeId: string | null;             // 현재 편집 중인 ID (부모에서 관리)
  onChangeActive: (id: string | null) => void;

  onSave?: (value: string) => void;
  onCancel?: () => void;
}

export const TextAreaWithActions: React.FC<TextAreaWithActionsProps> = ({
  id,
  maxLength = 100,
  minLength = 10,
  initialValue = "",
  placeholder = "",
  activeId,
  onChangeActive,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);           // 현재 입력값
  const [savedValue, setSavedValue] = useState(initialValue); // 마지막 저장값

  const isActive = activeId === id;          // 지금 이 컴포넌트가 편집 중인지
  const isSaved = savedValue.length > 0;     // 뭔가 한 번이라도 저장됐는지

  const length = isActive ? value.length : savedValue.length;
  const isValid = length >= minLength;

  const handleFocus = () => {
    if (activeId && activeId !== id) {
      window.alert("작성 중인 다른 답변이 있어요. 저장 또는 취소 후 이동해 주세요.");
    }
    // 어쨌든 이 TextArea로 포커스를 넘김
    onChangeActive(id);
  };

  const handleSave = () => {
    if (!isValid) return;
    setSavedValue(value);
    onChangeActive(null);     // 저장 후 편집 종료
    onSave?.(value);
  };

  const handleCancel = () => {
    // 마지막 저장값(없으면 initialValue)로 롤백
    setValue(savedValue || initialValue);
    onChangeActive(null);     // 편집 종료
    onCancel?.();
  };

  const handleSavedClick = () => {
    // 저장된 텍스트 눌렀을 때 다시 수정 모드 진입
    if (activeId && activeId !== id) {
      window.alert("작성 중인 다른 답변이 있어요. 저장 또는 취소 후 이동해 주세요.");
    }
    onChangeActive(id);
  };

  return (
    <Wrapper>
      {/* 입력 / 저장 텍스트 영역 */}
      {isSaved && !isActive ? (
        <SavedText onClick={handleSavedClick}>
          {savedValue}
        </SavedText>
      ) : (
        <StyledTextarea
          value={value}
          onChange={(e) => isActive && setValue(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={activeId !== null && !isActive} // 다른 애가 active면 입력 잠금
        />
      )}

      {/* 하단 영역 */}
      {isActive ? (
        <FooterRow>
          <p>
            {value.length}/{maxLength} (최소 {minLength}자 이상)
          </p>

          <ActionGroup>
            <button className="cancel" onClick={handleCancel}>
              취소
            </button>
            <button
              className="save"
              onClick={handleSave}
              disabled={value.length < minLength}
            >
              저장
            </button>
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
  );
};

// -------------------------------
// Styled Components
// -------------------------------

const Wrapper = styled.div`
  padding: 16px;
  border-radius: 16px;
  border: 2px solid #b7b3ae; /* TODO: 토큰으로 교체 */
  background: #f0eeeb;       /* TODO: 토큰으로 교체 */
  
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
    color: #b7b3ae;
  }

  
`;

const SavedText = styled.p`
  font-size: 16px;
  margin: 0;
  padding: 4px 0;
  cursor: pointer; /* 수정 가능하다는 느낌 */
`;

const FooterRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    margin: 0;
    font-size: 13px;
    color: #8c8a87;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 16px;

  button {
    border: none;
    background: none;
    font-size: 15px;
    cursor: pointer;
    padding: 4px 0;
  }

  .cancel {
    color: #8c8a87;
  }

  .save {
    color: #000;
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
