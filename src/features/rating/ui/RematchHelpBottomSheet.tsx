import styled from "styled-components";
import { BottomSheet } from "@/shared/ui";

interface RematchHelpBottomSheetProps {
  onClose: () => void;
}

export function RematchHelpBottomSheet({ onClose }: RematchHelpBottomSheetProps) {
  return (
    <BottomSheet
      title="💝 1:1 재매칭 프로세스란?"
      detail={
        <Description>
          대화를 나눈 상대방과 1:1 매칭을 다시 신청할 수 있어요. 내가 신청하고, 상대방도
          나를 선택하면 즉시 매칭이 성사돼요. 채팅방은 매주 금요일 자정에 열리며, 신청
          여부는 상대방에게 공개되지 않아요.
        </Description>
      }
      closer={onClose}
    />
  );
}

const Description = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-reading-font-size);
  font-weight: var(--typography-body-2-reading-font-weight);
  line-height: var(--typography-body-2-reading-line-height);
  letter-spacing: var(--typography-body-2-reading-letter-spacing);
  color: var(--color-semantic-label-normal);
`;
