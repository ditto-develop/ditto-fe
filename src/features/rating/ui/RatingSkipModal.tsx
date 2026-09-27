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
      message="남겨주신 평가는 다음 매칭과 만남에 도움이 돼요."
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
