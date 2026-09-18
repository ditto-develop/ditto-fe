"use client"; // Next.js App Router에서 클라이언트 훅(usePathname)을 쓰기 위해 필수

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Caption2 } from '@/shared/ui';
import { Icon, type IconName } from '@/shared/ui';
import { useChatUnreadTotal } from '@/features/chat/hooks/useChatUnreadTotal';
import { isPathActive } from '@/shared/lib/routePath';

// 1. 네비게이션 아이템 설정 (경로, 라벨, 아이콘 경로 등)
// 실제 프로젝트에 있는 이미지 경로로 교체해주세요.
const NAV_ITEMS = [
  {
    label: '홈',
    path: '/home', // 메인 페이지
    iconName: 'tab.home',
  },
  {
    label: '대화방',
    path: '/chat',
    iconName: 'tab.talk',
  },
  {
    label: '프로필',
    path: '/profile',
    iconName: 'tab.profile',
  },
] satisfies Array<{ label: string; path: string; iconName: IconName }>;

const MainBottomNav = () => {
  const pathname = usePathname(); // 현재 경로 가져오기
  const chatUnreadTotal = useChatUnreadTotal();

  return (
    <NavContainer>
      {NAV_ITEMS.map((item) => {
        // trailingSlash 설정 탓에 하드 로드면 "/home/", 클라이언트 내비게이션이면 "/home"이
        // 들어온다. 문자열 동등 비교로는 전자가 통째로 빗나가므로 정규화해서 본다.
        const isActive = isPathActive(pathname, item.path);
        // 대화방 탭에만 카카오톡식 안읽음 배지를 단다. 다른 탭에는 셀 값이 없다.
        const badgeCount = item.path === "/chat" ? chatUnreadTotal : 0;

        return (
          <NavItem
            key={item.path}
            href={item.path}
            aria-current={isActive ? "page" : undefined}
          >
            {/* 이미지 영역: 활성 상태에 따라 다른 이미지 렌더링 */}
            <IconWrapper>
              <TabIcon name={item.iconName} $isActive={isActive} />
              {badgeCount > 0 && (
                <UnreadBadge aria-label={`안 읽은 메시지 ${badgeCount}개`}>
                  {badgeCount > 99 ? "99+" : badgeCount}
                </UnreadBadge>
              )}
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

export { MainBottomNav };

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
  position: relative; // 안읽음 배지를 아이콘 우상단에 얹기 위한 기준
  margin-bottom: 4px; // 아이콘과 텍스트 사이 간격
  /* 이미지가 div 배경이 아니라 img 태그로 들어가므로 사이즈 제어는 Image 컴포넌트나 여기서 */
`;

/**
 * 대화방 탭 안읽음 배지. 목록 줄의 배지(ChatRoomListItem)와 같은 색·글자를 쓰되,
 * 탭 아이콘 위에 얹히므로 크기만 줄인다. '99+'가 들어가도 넘치지 않게 폭은 최소값만 잡는다.
 */
const UnreadBadge = styled.span`
  position: absolute;
  top: -4px;
  left: 60%;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-2-font-size);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
`;

const TabIcon = styled(Icon)<{ $isActive: boolean }>`
  color: ${({ $isActive }) =>
    $isActive
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-interaction-inactive)"};
`;

const NavLabel = styled(Caption2)<{ $isActive: boolean }>`
  // Caption2의 기본 스타일은 유지됨

  // 활성 상태에 따른 색상 변경 로직 추가
  color: ${({ $isActive }) => ($isActive ? 'var(--color-semantic-primary-normal)' : 'var(--color-semantic-interaction-inactive)')};

  // (선택사항) 활성화 시 폰트를 두껍게 하고 싶다면 추가, 아니면 제거
  // font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'inherit')};
`;
