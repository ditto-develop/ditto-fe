"use client";

import { useState, useRef, KeyboardEvent } from "react";
import styled from "styled-components";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const canSend = value.trim().length > 0 && !sending && !disabled;

  return (
    <Outer>
      <FieldWrapper>
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="텍스트를 입력해 주세요."
          rows={1}
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
  background-color: var(--color-semantic-background-normal-normal, #E9E6E2);
  padding: 16px;
  box-sizing: border-box;
`;

const FieldWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(108, 101, 95, 0.16);
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.03);
  background: transparent;
`;

const TextArea = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  padding: 0 4px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.057px;
  color: var(--color-semantic-label-normal, #1A1815);
  max-height: 120px;
  overflow-y: auto;

  &::placeholder {
    color: rgba(47, 43, 39, 0.28);
  }
`;

const SendButton = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
  background-color: var(--color-semantic-primary-normal, #1A1815);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${({ $active }) => ($active ? 1 : 0.4)};
  transition: opacity 0.15s;
  padding: 7px;
  box-sizing: border-box;
`;
