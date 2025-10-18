import React, { useEffect, useState } from 'react';
import {IconContainer, ShareIconContainer,Backdrop,BottomSheetContainer,ShareImgContainer, ButtonContainer } from './Container';
import Image from 'next/image';
import {BottomTitle, BottomSubTitle} from './Text';
import { Whitebutton } from '../Button';
import useDeviceType from '@/hooks/useDeviceType';
import toast, { Toaster } from 'react-hot-toast';
import styled from 'styled-components';

const CustomToast = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* ✅ 왼쪽 정렬 */
  padding: 12px 16px;
  background-color: #00000066;
  color: white;
  font-size: 16px;
  width: 327px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  text-align: left;
`;

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
    /**Hook Section */
    const device = useDeviceType();

    /**State Section */

    /**Effect Section */
    useEffect(() => {

    }, []);

    /**Function Section */
    
    function handleOnClickKakao() {
        if (typeof window === "undefined" || !window.Kakao) {
          
          console.log("⚠️ Kakao SDK not ready");
          return;
        }

        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
        }

        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: "ditto - 수백만의 스침 속, 단 하나의 멈춤",
            description: "4096개의 질문 중 저와 같은 질문을 선택한 사람은 8명이였습니다. 단순한 우연일까요?",
            imageUrl: capturedImage,
            imageWidth: 640,
            imageHeight: 640,
            link: {
              webUrl: process.env.NEXT_PUBLIC_DNS,
              mobileWebUrl: process.env.NEXT_PUBLIC_DNS,
            },
          },
        });
    }


    const handleCopyLink = async () => {
      await navigator.clipboard.writeText(String(process.env.NEXT_PUBLIC_DNS));
    };

    const handleShare = async () => {
      if(device === 'mobile' || device === 'tablet'){
        if (navigator.share) {
          try {
            await navigator.share({
              title: "ditto - 수백만의 스침 속, 단 하나의 멈춤",
              text: "4096개의 질문 중 저와 같은 질문을 선택한 사람은 8명이였습니다.",
              url: process.env.NEXT_PUBLIC_DNS,
            });
            console.log("✅ 공유 성공");
          } catch (err) {
            console.error("❌ 공유 실패:", err);
          }
      }}else {
          handleCopyLink();
      }

      toast.custom(
        (t) => (
          <CustomToast aria-live="polite">
            <div>링크가 복사되었습니다.</div>
          </CustomToast>
        ),
        { 
          duration: 3000 
        }
      );
  };


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
            capturedImage ? (
                <Image
                    crossOrigin='anonymous'
                    src={capturedImage}
                    alt="결과 이미지"
                    width={168}
                    height={328}
                    unoptimized={true}
                />
            ) : (
                <div style={{
                    width: 168,
                    height: 328,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: '#888',
                    textAlign: 'center',
                    borderRadius: '10px'
                }}>
                    이미지 생성 중...
                </div>
            )}
        </ShareImgContainer>
        <ButtonContainer>
            <Whitebutton
                onClick={handleCapture}
                >이미지 저장하기</Whitebutton>
            <ShareIconContainer>
                <IconContainer
                    onClick={handleShare}
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
            <Toaster 
                position="bottom-center"
                reverseOrder={false}
            />
        </ButtonContainer>
      </BottomSheetContainer>
    </>
  );
}