import styled from "styled-components"
import { Headline2Bold } from "@/shared/ui";

// TypeScript 사용 시 Interface 정의 (필요 없으시면 삭제 가능)
interface NavProps {
  prev?: () => void;   // 뒤로가기 함수 (없으면 아이콘 숨김)
  close?: () => void;  // 닫기 함수 (없으면 아이콘 숨김)
  label?: string;      // 중앙 타이틀
}

export function Nav({ prev, close, label }: NavProps) {
  return (
    <NavContainer>
      {/* prev 함수가 있을 때만 보이지만(visible), 
         없어도 공간은 차지하게(hidden) 해서 라벨 정중앙 유지 
      */}
      <IconBox
        onClick={prev}
        $isVisible={!!prev}
      >
        <IconImg src="/icons/navigation/arrow-left.svg" alt="back" />
      </IconBox>

      {/* 중앙 라벨 */}
      <Headline2Bold $color="var(--color-semantic-label-strong)">
        {label}
      </Headline2Bold>

      {/* close 함수 유무에 따른 처리 */}
      <IconBox
        onClick={close}
        $isVisible={!!close}
      >
        <IconImg src="/icons/navigation/close.svg" alt="close" />
      </IconBox>
    </NavContainer>
  );
}

// --- Styled Components ---

const NavContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;

  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 100%;
  /**
   * 앱(네이티브 셸)에서는 웹뷰가 상태바 아래로 깔려 있어 그대로 두면 제목이 잘린다.
   * 인셋만큼 바를 키우고 같은 값으로 위를 비워, 콘텐츠 영역은 56px을 유지한다.
   * 웹에서는 env()가 0이라 기존과 완전히 동일하다. (TopNavigation과 동일 패턴)
   */
  height: calc(56px + env(safe-area-inset-top, 0px)); // 일반적인 모바일 Nav 높이 지정 (필요 시 조절)
  padding: env(safe-area-inset-top, 0px) 16px 0; // 좌우 패딩만 주고 높이는 고정하는 것이 배치에 유리합니다
  box-sizing: border-box;

  background-color: var(--color-semantic-background-normal-normal);
`;

// 클릭 가능한 영역 확보 및 정렬
const IconBox = styled.div<{ $isVisible: boolean }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $isVisible }) => ($isVisible ? 'pointer' : 'default')};
  
  // 기능이 없으면 숨기되 공간은 유지 (layout shift 방지)
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
`;

const IconImg = styled.img`
  width: 100%;
  height: 100%;
  display: block;
`;
