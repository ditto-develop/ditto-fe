"use client";

import { AlertModal } from "@/shared/ui";

interface ChatLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ChatLeaveModal({
  isOpen,
  onClose,
  onConfirm,
}: ChatLeaveModalProps) {
  return (
    <AlertModal
      isOpen={isOpen}
      title="정말 대화를 종료하시겠어요?"
      message="이 대화를 끝내면 이번주는 다시 대화할 수 없어요."
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
