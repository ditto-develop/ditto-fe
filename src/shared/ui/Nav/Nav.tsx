import styled from "styled-components"
import { Heading1Bold } from "@/shared/ui";

// TypeScript 사용 시 Interface 정의 (필요 없으시면 삭제 가능)
interface NavProps {
  prev?: () => void;   // 뒤로가기 함수 (없으면 아이콘 숨김)
  close?: () => void;  // 닫기 함수 (없으면 아이콘 숨김)
  label?: string;      // 중앙 타이틀
}

export function Nav({ prev, close, label }: NavProps) {
  console.log('[src/shared/ui/Nav/Nav.tsx] Nav'); // __component_log__
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
      <Heading1Bold>
        {label}
      </Heading1Bold>

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
  height: 56px; // 일반적인 모바일 Nav 높이 지정 (필요 시 조절)
  padding: 0 16px; // 좌우 패딩만 주고 높이는 고정하는 것이 배치에 유리합니다
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

const NavLabel = styled.div`
  font-size: var(--typography-body-1-normal-font-size); // 디자인에 맞춰 조절
  font-weight: 700;
  color: var(--color-semantic-label-strong); // 토큰 적용
  text-align: center;
  flex: 1; // 양쪽 아이콘 사이의 남은 공간을 모두 차지
  
  // 긴 텍스트 말줄임 처리
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
