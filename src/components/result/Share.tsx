import React, { useEffect, useState } from 'react';
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

    /**State Section */

    /**Effect Section */
    useEffect(() => {

    }, []);

    /**Function Section */
    

    async function handleOnClickKakao() {
      try {
        if (!window.Kakao?.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
          console.log("⚠️ Kakao SDK가 늦게 초기화되어 지금 초기화함");
        }

        if (window.Kakao && window.Kakao.Share) {
          window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: "ditto - 공통의 끌림[수정예정]",
              description: "4096개의 질문 중 저와 같은 질문을 선택한 사람은 8명이였습니다. 단순한 우연일까요, 가치관의 차이일까요?",
              imageUrl: capturedImage,
              imageWidth: 640,
              imageHeight: 640,
              link: {
                webUrl: process.env.NEXT_PUBLIC_DNS,
                mobileWebUrl: process.env.NEXT_PUBLIC_DNS,
              },
            },
          });
        } else {
          console.log("⚠️ Kakao SDK 로드 실패");
        }
      } catch (err) {
        console.error("❌ 이미지 업로드 또는 공유 실패:", err);
      }
    }

  return (
    <>
      <Backdrop />
      <BottomSheetContainer>
        <div style={{display: "grid", gap: "10px"}}>
            <div style={{display: "flex", justifyContent: "space-between", position: 'relative' }}>
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
            {
            capturedImage && (
                <Image
                    crossOrigin='anonymous'
                    src={capturedImage}
                    alt="결과 이미지"
                    width={168}
                    height={328}
                    unoptimized={true}
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
                <IconContainer
                    onClick={handleOnClickKakao}
                >
                    <Image src='./icons/chat.svg'
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