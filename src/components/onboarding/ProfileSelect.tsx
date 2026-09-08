import { ActionContainer } from "@/components/onboarding/OnboardingContainer";
import { Title3 } from "@/shared/ui";
import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { ActionButton, ActionSheet } from "@/components/input/Action";

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

/**
 * 화면 전체를 덮는 시트.
 *
 * 예전에는 Wrapper 하나가 스크롤을 맡고 하단 버튼이 position:fixed로 그 위에 떠 있었다.
 * 그래서 마지막 아바타 줄이 버튼 뒤에 깔린 채 더 내려가지 않아 "스크롤이 안 된다"로 보였다.
 * 이제 헤더/탭·스크롤 영역·버튼을 세로로 나눠 잡고, 스크롤은 아바타 그리드에만 준다.
 */
const Wrapper = styled.div`
  position: fixed;
  inset: 0;                /* top, right, bottom, left 전부 0 */
  z-index: 9999;

  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;
  box-sizing: border-box;   /* padding을 width/height 안으로 포함 */

  margin: 0 auto;
  background: var(--color-semantic-background-normal-normal);
  overflow: hidden;         /* 스크롤은 AvatarScrollArea가 맡는다 */

  /* 인스턴스로 바로 나타나던 걸 바텀시트처럼 아래에서 위로 올라오게. */
  animation: ${slideUp} 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
`;

const StickyTop = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: calc(env(safe-area-inset-top, 0px) + 44px) 16px 16px;
  box-sizing: border-box;
`;

const AvatarScrollArea = styled.div`
  flex: 1 1 auto;
  min-height: 0;            /* flex 자식이 내용만큼 늘어나 스크롤을 죽이지 않도록 */
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 16px;
  box-sizing: border-box;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr;
  width: 100%;


`;

const CloseButton = styled.button`
    width: 100%;
  border: none;
  background: none;
  font-size: var(--typography-title-3-font-size);
  cursor: pointer;
  text-align: right;
`;

const TabRow = styled.div`
    display: flex;
    height: 32px;
    padding: 2px;
    align-items: center;
    align-self: stretch;
    border-radius: 8px;
    background: var(--Fill-Normal, rgba(108, 101, 95, 0.08));
`;

const TabButton = styled.button<{ $active: boolean }>`
display: flex;
padding: 9px;
justify-content: center;
align-items: center;
flex: 1 0 0;
align-self: stretch;
  background: ${({ $active }) => ($active ? "var(--color-semantic-background-normal-normal)" : "transparent")};
  color: ${({ $active}) => (!$active ? "var(--color-semantic-label-alternative)" : "var(--color-semantic-label-normal);")};

  font-weight: ${({ $active }) => ($active ? 600 : 400)};
box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.08);

border-radius: 6px;


`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* 모바일 2열 또는 3열로 조정 가능 */
  gap: 16px;
`;

const AvatarItem = styled.button`
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  min-width: 0;
`;

/* 좁은 화면에서 160px 고정이면 2열이 가로로 넘친다. 열 폭을 따라가되 최대 160px. */
const AvatarWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 160px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
`;

const AvatarCircle = styled.div<{ $selected?: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--color-semantic-background-normal-alternative);
  border: ${({ $selected }) =>
    $selected
      ? "4px solid var(--color-semantic-line-solid-normal)"
      : "1px solid var(--color-semantic-line-normal-alternative)"};
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const CheckBadge = styled.div`
  position: absolute;
  right: 10px;
  top: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-semantic-primary-normal);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CheckIcon = styled.img`
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(1);
`;

interface CaricatureSelectProps {
  profile: string | null;                       // 현재 선택된 아바타 id
  setProfile: (profile: string) => void;       // 아바타 선택
  setProfileModal: (open: boolean) => void;    // 모달 열고 닫기
}

const maleAvatars = [
  { id: "m1", src: "/assets/avatar/m1.png" },
  { id: "m2", src: "/assets/avatar/m2.png" },
  { id: "m3", src: "/assets/avatar/m3.png" },
  { id: "m4", src: "/assets/avatar/m4.png" },
  { id: "m5", src: "/assets/avatar/m5.png" },
  { id: "m6", src: "/assets/avatar/m6.png" },
  { id: "m7", src: "/assets/avatar/m7.png" },
  { id: "m8", src: "/assets/avatar/m8.png" },
];

const femaleAvatars = [
  { id: "f1", src: "/assets/avatar/f1.png" },
  { id: "f2", src: "/assets/avatar/f2.png" },
  { id: "f3", src: "/assets/avatar/f3.png" },
  { id: "f4", src: "/assets/avatar/f4.png" },
  { id: "f5", src: "/assets/avatar/f5.png" },
  { id: "f6", src: "/assets/avatar/f6.png" },
  { id: "f7", src: "/assets/avatar/f7.png" },
  { id: "f8", src: "/assets/avatar/f8.png" },
];

const ProfileSelect: React.FC<CaricatureSelectProps> = ({
  profile,
  setProfile,
  setProfileModal,
}) => {
  const [gender, setGender] = useState<"male" | "female">("male");

  const avatarList = gender === "male" ? maleAvatars : femaleAvatars;

  const handleSelectAvatar = (id: string) => {
    setProfile(id);
  };

  return (
    <Wrapper>
      {/* 상단 헤더 + 성별 탭: 스크롤과 무관하게 고정 */}
      <StickyTop>
        <HeaderRow>
          <CloseButton onClick={() => setProfileModal(false)}>✕</CloseButton>
          <Title3 $weight="bold">캐리커쳐 선택하기</Title3>
        </HeaderRow>

        <TabRow>
          <TabButton
            type="button"
            $active={gender === "male"}
            onClick={() => setGender("male")}
          >
            남자
          </TabButton>
          <TabButton
            type="button"
            $active={gender === "female"}
            onClick={() => setGender("female")}
          >
            여자
          </TabButton>
        </TabRow>
      </StickyTop>

      {/* 아바타 그리드: 여기만 스크롤한다 */}
      <AvatarScrollArea>
        <AvatarGrid>
          {avatarList.map((avatar) => {
            const selected = profile === avatar.id;
            return (
              <AvatarItem key={avatar.id} onClick={() => handleSelectAvatar(avatar.id)}>
                <AvatarWrapper>
                  <AvatarCircle $selected={selected}>
                    <img src={avatar.src} alt={avatar.id} />
                  </AvatarCircle>
                  {selected && (
                    <CheckBadge>
                      <CheckIcon src="/icons/status/profile-check.svg" alt="" />
                    </CheckBadge>
                  )}
                </AvatarWrapper>
              </AvatarItem>
            );
          })}
        </AvatarGrid>
      </AvatarScrollArea>

      {/* 하단 버튼 */}
      <Bottom>
        <ActionContainer>
            <ActionSheet>
            <ActionButton 
                onClick={()=>{setProfileModal(false)}} 
            >
                골랐어요
            </ActionButton>
            </ActionSheet>
        </ActionContainer>
      </Bottom>
      
    </Wrapper>
  );
};

/* 흐름 안에 두어 스크롤 영역의 마지막 줄을 가리지 않게 한다. */
const Bottom = styled.div`
    flex: 0 0 auto;
    width: 100%;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--color-semantic-background-normal-normal);
`

export { ProfileSelect };
