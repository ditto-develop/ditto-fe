"use client";

import { AlertModal } from "@/shared/ui";

interface RematchSuccessModalProps {
  nickname: string;
  onClose: () => void;
}

/**
 * 성사와 방 생성은 다른 시점이다(1분 주기 스케줄러). 좁은 경쟁 구간에서 상대가
 * 탈퇴하면 방이 영영 생기지 않을 수도 있어 "곧 열려요" 같은 확정 문구는 쓰지 않는다.
 */
export function RematchSuccessModal({ nickname, onClose }: RematchSuccessModalProps) {
  return (
    <AlertModal
      isOpen
      title="💝 1:1 재매칭 성사!"
      message={`${nickname}님도 회원님을 선택했어요. 성사되면 다음 금요일에 1:1 채팅방이 열려요.`}
      onClose={onClose}
      confirmParams={{ text: "확인", onClick: onClose }}
    />
  );
}
