"use client";

import { AlertModal } from "@/shared/ui";

interface ChatLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 그룹 방은 "나만 빠지고 방은 남는다"라 문구가 다르다. 생략하면 1:1 문구를 쓴다. */
  title?: string;
  message?: string;
}

export function ChatLeaveModal({
  isOpen,
  onClose,
  onConfirm,
  title = "정말 대화를 종료하시겠어요?",
  message = "이 대화를 끝내면 이번주는 다시 대화할 수 없어요.",
}: ChatLeaveModalProps) {
  return (
    <AlertModal
      isOpen={isOpen}
      title={title}
      message={message}
      cancelParams={{
        text: "나가기",
        onClick: onConfirm,
        isDestructive: true,
      }}
      confirmParams={{
        text: "취소",
        onClick: onClose,
      }}
    />
  );
}
