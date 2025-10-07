import React from 'react';
import {IconContainer, ShareIconContainer,Backdrop,BottomSheetContainer,ShareImgContainer, ButtonContainer } from './Container';
import Image from 'next/image';
import {BottomTitle, BottomSubTitle} from './Text';
import { Whitebutton } from '../Button';

type shareType = {
    handleIsshare: () => void
}

export default function Share({handleIsshare}: shareType) {
  return (
    <>
      <Backdrop />
      <BottomSheetContainer>
        <div style={{display: "grid", gap: "10px"}}>
            <div style={{display: "flex", justifyContent: "space-between"}}>
                <BottomTitle>공유해보세요</BottomTitle>
                <Image 
                    onClick={handleIsshare}
                    src='/icons/x.svg'
                    alt='x icons'
                    width={24}
                    height={24}
                />
            </div>
            <div>
                <BottomSubTitle>주변 사람들은 어떤 선택을 고를까요?</BottomSubTitle>
                <BottomSubTitle>당신의 선택이 얼마나 드문지 공유하고 친구와 비교해보세요.</BottomSubTitle>
            </div>
        </div>
        <ShareImgContainer>
            <Image 
                src="/testImg.png"
                alt='테스트'
                width={168}
                height={328}
            />
        </ShareImgContainer>
        <ButtonContainer>
            <Whitebutton>이미지 저장하기</Whitebutton>
            <ShareIconContainer>
                <IconContainer>
                    <Image src='./icons/link.svg'
                           alt='link' width={32} height={32}/>
                </IconContainer>
                <IconContainer>
                    <Image src='./icons/chat.svg'
                           alt='link' width={24} height={32}/>
                </IconContainer>
                <IconContainer>
                    <Image src='./icons/insta.svg'
                           alt='link' width={24} height={32}/>
                </IconContainer>
                <IconContainer>
                    <Image src='./icons/twitter.svg'
                           alt='link' width={24} height={32}/>
                </IconContainer>                
            </ShareIconContainer>
        </ButtonContainer>
      </BottomSheetContainer>
    </>
  );
}