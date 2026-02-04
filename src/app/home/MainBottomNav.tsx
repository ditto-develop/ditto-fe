"use client"; // Next.js App Router에서 클라이언트 훅(usePathname)을 쓰기 위해 필수

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Caption2 } from '@/components/common/Text';

// 1. 네비게이션 아이템 설정 (경로, 라벨, 아이콘 경로 등)
// 실제 프로젝트에 있는 이미지 경로로 교체해주세요.
const NAV_ITEMS = [
  {
    label: '홈',
    path: '/home', // 메인 페이지
    iconOn: '/icons/home-on.svg', 
    iconOff: '/icons/home-off.svg',
  },
  {
    label: '대화방',
    path: '/chat',
    iconOn: '/icons/talk-on.svg',
    iconOff: '/icons/talk-off.svg',
  },
  {
    label: '프로필',
    path: '/profile',
    iconOn: '/icons/profile-on.svg',
    iconOff: '/icons/profile-off.svg',
  },
];

const MainBottomNav = () => {
  const pathname = usePathname(); // 현재 경로 가져오기

  return (
    <NavContainer>
      {NAV_ITEMS.map((item) => {
        // 현재 경로가 해당 아이템의 path와 일치하는지 확인
        const isActive = pathname === item.path;

        return (
          <NavItem key={item.path} href={item.path}>
            {/* 이미지 영역: 활성 상태에 따라 다른 이미지 렌더링 */}
            <IconWrapper>
              <Image 
                src={isActive ? item.iconOn : item.iconOff} 
                alt={item.label}
                width={24} // 디자인 시안에 맞는 사이즈 입력
                height={24}
              />
            </IconWrapper>
            
            {/* 텍스트 영역: active 상태를 props로 전달하여 색상 변경 */}
            <NavLabel $isActive={isActive}>
              {item.label}
            </NavLabel>
          </NavItem>
        );
      })}
    </NavContainer>
  );
};

export default MainBottomNav;

// --- Styled Components ---

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px; // 시안에 맞춰 높이 조절
  background-color: var(--color-semantic-background-normal-normal);
  display: flex;
  justify-content: space-around; // 아이템 간격 균등 배치
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom); // 아이폰 하단 제스처 바 대응
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  flex: 1; // 터치 영역을 넓게 가져가기 위해
  height: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent; // 모바일 터치 시 하이라이트 제거
`;

const IconWrapper = styled.div`
  margin-bottom: 4px; // 아이콘과 텍스트 사이 간격
  /* 이미지가 div 배경이 아니라 img 태그로 들어가므로 사이즈 제어는 Image 컴포넌트나 여기서 */
`;

const NavLabel = styled(Caption2)<{ $isActive: boolean }>`
  // Caption2의 기본 스타일은 유지됨

  // 활성 상태에 따른 색상 변경 로직 추가
  color: ${({ $isActive }) => ($isActive ? 'var(--color-semantic-primary-normal)' : 'var(--color-semantic-interaction-inactive,)')};

  // (선택사항) 활성화 시 폰트를 두껍게 하고 싶다면 추가, 아니면 제거
  // font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'inherit')};
`;