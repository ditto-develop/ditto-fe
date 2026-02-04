import { ActionContainer } from "@/components/onboarding/OnboardingContainer";
import { Title3 } from "@/components/common/Text";
import React, { useState } from "react";
import styled from "styled-components";
import { ActionButton, ActionSheet } from "../input/Action";

const Wrapper = styled.div`
  position: fixed;
  inset: 0;                /* top, right, bottom, left 전부 0 */
  z-index: 9999;

  display: flex;
  flex-direction: column;
  gap: 16px;

  /* safe area + padding */
  padding: calc(env(safe-area-inset-top, 0px) + 44px)
           16px
           calc(env(safe-area-inset-bottom, 0px) + 24px);

  width: 100%;
  height: 100%;
  box-sizing: border-box;   /* padding을 width/height 안으로 포함 */

  margin: 0 auto;
  background: var(--Background-Normal-Normal, #E9E6E2);
  overflow-y: auto;         /* 내용 많으면 스크롤 */
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
  font-size: 24px;
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
  background: ${({ $active }) => ($active ? "#E9E6E2" : "transparent")};
  color: ${({ $active}) => (!$active ? "var(--Semantic-Label-Alternative, var(--Label-Alternative, rgba(47, 43, 39, 0.61)))" : "var(--Semantic-Label-Normal, var(--Label-Normal, #1A1815));")};

  font-weight: ${({ $active }) => ($active ? 600 : 400)};
box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.08);

border-radius: 6px;


`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 모바일 2열 또는 3열로 조정 가능 */
  gap: 16px;
`;

const AvatarItem = styled.button`
  position: relative;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
`;

const AvatarCircle = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: var(--color-semantic-background-normal-alternative);
  border : 1px solid lightgray;
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CheckIcon = styled.img`
  width: 14px;
  height: 14px;
`;

const BottomButton = styled.button`
  margin-top: auto;
  width: 100%;
  height: 44px;
  border-radius: 999px;
  border: none;
  background: #111;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;


interface CaricatureSelectProps {
  profile: string | null;                       // 현재 선택된 아바타 id
  setProfile: (profile: string) => void;       // 아바타 선택
  setProfileModal: (open: boolean) => void;    // 모달 열고 닫기
}

const maleAvatars = [
  { id: "m1", src: "/onboarding/profileimg/avatar/m1.svg" },
  { id: "m2", src: "/onboarding/profileimg/avatar/m2.svg" },
  { id: "m3", src: "/onboarding/profileimg/avatar/m3.svg" },
  { id: "m4", src: "/onboarding/profileimg/avatar/m4.svg" },
  { id: "m5", src: "/onboarding/profileimg/avatar/m5.svg" },
  { id: "m6", src: "/onboarding/profileimg/avatar/m6.svg" },
  { id: "m7", src: "/onboarding/profileimg/avatar/m7.svg" },
  { id: "m8", src: "/onboarding/profileimg/avatar/m8.svg" },
];

const femaleAvatars = [
  { id: "f1", src: "/onboarding/profileimg/avatar/f1.svg" },
  { id: "f2", src: "/onboarding/profileimg/avatar/f2.svg" },
  { id: "f3", src: "/onboarding/profileimg/avatar/f3.svg" },
  { id: "f4", src: "/onboarding/profileimg/avatar/f4.svg" },
  { id: "f5", src: "/onboarding/profileimg/avatar/f5.svg" },
  { id: "f6", src: "/onboarding/profileimg/avatar/f6.svg" },
  { id: "f7", src: "/onboarding/profileimg/avatar/f7.svg" },
  { id: "f8", src: "/onboarding/profileimg/avatar/f8.svg" },
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
      {/* 상단 헤더 */}
      <HeaderRow>
        <CloseButton onClick={() => setProfileModal(false)}>✕</CloseButton>
        <Title3 $weight="bold">캐리커처 선택하기</Title3>
      </HeaderRow>

      {/* 성별 탭 */}
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

      {/* 아바타 그리드 */}
      <AvatarGrid>
        {avatarList.map((avatar) => {
          const selected = profile === avatar.id;
          return (
            <AvatarItem key={avatar.id} onClick={() => handleSelectAvatar(avatar.id)}>
              <AvatarCircle>
                <img src={avatar.src} alt={avatar.id} />
              </AvatarCircle>
              {selected && (
                <CheckBadge>
                  <CheckIcon src='/onboarding/profileimg/check.svg' />
                </CheckBadge>
              )}
            </AvatarItem>
          );
        })}
      </AvatarGrid>

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

const Bottom = styled.div`
    position: fixed;
    width: 100%;

    bottom: 0;
    left: 0;
`

export default ProfileSelect;
