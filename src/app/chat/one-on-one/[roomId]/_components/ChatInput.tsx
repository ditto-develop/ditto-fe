"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useState, useRef } from "react";
import styled from "styled-components";

import {
  CHAT_IMAGE_MAX_COUNT,
  CHAT_IMAGE_MAX_SIZE_BYTES,
  CHAT_TEXT_MAX_LENGTH,
  containsForbiddenWord,
} from "@/features/chat";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/shared/ui";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  /** 이미지 첨부. 미지정 시 첨부 버튼을 숨긴다. */
  onSendImages?: (files: File[]) => Promise<void>;
  disabled?: boolean;
}

/** BE가 code 0001로 거절하는 상한과 동일하게 맞춘다. */
const MAX_MESSAGE_LENGTH = CHAT_TEXT_MAX_LENGTH;
const TEXTAREA_MAX_HEIGHT = 190;

export function ChatInput({ onSend, onSendImages, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.overflowY = "hidden";
      }
    } catch (err: unknown) {
      // 소켓이 끊긴 상태의 전송 실패는 입력값을 지우지 않고 그대로 알린다.
      showToast(err instanceof Error ? err.message : "메시지를 보내지 못했어요.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    // 같은 파일을 연속으로 고를 수 있도록 값을 비운다.
    event.target.value = "";
    if (selected.length === 0 || !onSendImages) return;

    const oversized = selected.filter((file) => file.size > CHAT_IMAGE_MAX_SIZE_BYTES);
    if (oversized.length > 0) showToast("이미지는 10MB 이하만 보낼 수 있어요.", "error");

    const accepted = selected
      .filter((file) => file.size <= CHAT_IMAGE_MAX_SIZE_BYTES)
      .slice(0, CHAT_IMAGE_MAX_COUNT);
    if (accepted.length === 0) return;

    setSending(true);
    try {
      await onSendImages(accepted);
    } catch {
      showToast("이미지를 보내지 못했어요.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    /**
     * 한글 IME 조합 중의 Enter는 무시한다.
     *
     * 크롬은 조합 중 Enter에 keydown을 **두 번** 쏜다 — 조합 확정용(isComposing: true)과
     * 실제 Enter. 가드가 없으면 첫 번째가 "안녕하세요"를 보내고 value를 비우는데,
     * 조합이 아직 안 끝나 compositionend가 마지막 글자("요")를 되돌려 놓고,
     * 두 번째 keydown이 그 "요"를 한 번 더 보낸다.
     *
     * keyCode 229는 isComposing을 안 채우는 구형 IME 대비다(deprecated지만 폴백으로만 쓴다).
     */
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  };

  const canSend = value.trim().length > 0 && !sending && !disabled;
  const hasForbiddenWord = containsForbiddenWord(value);

  return (
    <Outer>
      {hasForbiddenWord && (
        <InputWarning role="status">채팅 내 금칙어가 있습니다.</InputWarning>
      )}
      <FieldWrapper>
        {onSendImages && (
          <>
            <AttachButton
              type="button"
              aria-label="이미지 첨부"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || disabled}
            >
              <Icon name="action.camera" size={20} />
            </AttachButton>
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
          </>
        )}
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="텍스트를 입력해 주세요."
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
        />
        <SendButton onClick={handleSend} disabled={!canSend} $active={canSend}>
          <img src="/icons/action/send.svg" alt="전송" width={18} height={18} />
        </SendButton>
      </FieldWrapper>
    </Outer>
  );
}

const Outer = styled.div`
  position: relative;
  flex-shrink: 0;
  background-color: var(--color-semantic-background-normal-normal);
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
`;

const InputWarning = styled.div`
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  bottom: calc(100% + var(--space-3));
  z-index: 10;
  padding: var(--spacing-10px) var(--space-4);
  border-radius: var(--space-3);
  background-color: var(--color-semantic-inverse-background);
  color: var(--color-semantic-inverse-label);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  box-sizing: border-box;
`;

const FieldWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(108, 101, 95, 0.16);
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.03);
  background: transparent;
  box-sizing: border-box;
`;

const AttachButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.6;

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const TextArea = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  padding: 0 4px;
  font-family: inherit;
  font-size: var(--typography-body-1-normal-font-size);
  line-height: 1.5;
  font-weight: 400;
  letter-spacing: 0.0912px;
  color: var(--color-semantic-label-normal);
  max-height: 190px;
  overflow-y: hidden;
  box-sizing: border-box;

  &::placeholder {
    color: var(--color-semantic-label-assistive);
  }
`;

const SendButton = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
  background-color: var(--color-semantic-primary-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${({ $active }) => ($active ? 1 : 0.4)};
  transition: opacity 0.15s;
  padding: 7px;
  box-sizing: border-box;
`;
