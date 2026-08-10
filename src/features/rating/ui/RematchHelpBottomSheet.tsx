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
          그룹에서 대화한 상대와 1:1로 다시 만나고 싶다면 체크해 주세요. 서로 선택하면
          성사되고, 성사된 뒤 처음 오는 금요일 자정에 1:1 채팅방이 열려요. 한 번 제출한
          의사는 바꿀 수 없고, 내 선택은 상대방에게 공개되지 않아요.
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
