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
import { AlertModal, Icon } from "@/shared/ui";

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
  /** 금칙어 확인 대기 중인 문장. null 이면 확인 모달이 닫혀 있다. */
  const [pendingForbidden, setPendingForbidden] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;

    /**
     * 금칙어가 있으면 한 번 더 묻는다.
     *
     * 예전에는 입력창 위 배너로 알리기만 하고 전송은 그대로 됐다 — 경고를 못 본 채 나가는
     * 메시지가 그대로 남았다(2026-09-15 QA). 그렇다고 바로 막지는 않는다: 매칭은 부분 일치라
     * `불알친구` 같은 정상 문장을 오탐하고, 그때 보낼 길이 아예 없으면 대화가 끊긴다.
     */
    if (containsForbiddenWord(trimmed)) {
      setPendingForbidden(trimmed);
      return;
    }

    void sendText(trimmed);
  };

  const sendText = async (trimmed: string) => {
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

  const confirmForbidden = () => {
    const trimmed = pendingForbidden;
    setPendingForbidden(null);
    if (trimmed) void sendText(trimmed);
  };

  /** 고쳐 쓰겠다는 뜻이니 입력창으로 돌려보낸다 — 키보드가 닫혀 있으면 다시 올라온다. */
  const cancelForbidden = () => {
    setPendingForbidden(null);
    textareaRef.current?.focus();
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
        <SendButton
          /**
           * 버튼을 누르면 기본 동작으로 입력창의 포커스가 풀려 **키보드가 닫힌다**. 그러면
           * 시각 뷰포트가 커지는데 목록의 scrollTop 은 그대로라 마지막 메시지가 화면 밖으로
           * 밀려난다 — 사용자에게는 "보내자마자 대화가 내려가 버린다"로 보였다(2026-09-15 QA).
           * Enter 로 보낼 때는 포커스가 안 풀려 멀쩡했던 것이 이 차이다.
           */
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          disabled={!canSend}
          $active={canSend}
        >
          <img src="/icons/action/send.svg" alt="전송" width={18} height={18} />
        </SendButton>
      </FieldWrapper>

      <AlertModal
        isOpen={pendingForbidden !== null}
        title="금칙어가 포함되어 있어요"
        message={"부적절한 표현이 있는 것 같아요.\n그래도 이대로 보낼까요?"}
        confirmParams={{ text: "보내기", onClick: confirmForbidden, isDestructive: true }}
        cancelParams={{ text: "고칠래요", onClick: cancelForbidden }}
        onClose={cancelForbidden}
      />
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
