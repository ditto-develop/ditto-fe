"use client";

import { AlertModal } from "@/shared/ui";

interface RatingSkipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RatingSkipModal({ isOpen, onClose, onConfirm }: RatingSkipModalProps) {
  return (
    <AlertModal
      isOpen={isOpen}
      title="평가를 건너뛸까요?"
      message="지금 나가면 이번 매칭에 대한 평가를 다시 할 수 없어요"
      cancelParams={{
        text: "취소",
        onClick: onClose,
      }}
      confirmParams={{
        text: "건너뛰기",
        onClick: onConfirm,
      }}
    />
  );
}
