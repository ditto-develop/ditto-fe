import React from 'react';
import {IconContainer, ShareIconContainer,Backdrop,BottomSheetContainer,ShareImgContainer, ButtonContainer } from './Container';
import Image from 'next/image';
import {BottomTitle, BottomSubTitle} from './Text';
import { Whitebutton } from '../Button';

type shareType = {
    handleIsshare: () => void,
    handleCapture: () => void,
    capturedImage: string
}

export default function Share({capturedImage,handleCapture,handleIsshare}: shareType) {
    
    /**
     * 공유하기에 대한 개발노트 10.09
     * - 인스타그램 스토리 공유는 웹에서는 이론상 불가능하다고 판단
     * - 브라우저 자체 바텀시트 공유기능은 사용 가능.
     * - 카카오톡/X 공유하기 역시 가능. 따라서 이부분만 개발하면 될듯 함.
     */


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
            {capturedImage && (
                <Image
                    src={capturedImage}
                    alt="테스트"
                    width={168}
                    height={328}
                    unoptimized
                />
            )}
        </ShareImgContainer>
        <ButtonContainer>
            <Whitebutton
                onClick={handleCapture}
                >이미지 저장하기</Whitebutton>
            <ShareIconContainer>
                <IconContainer
                >
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