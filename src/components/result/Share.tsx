
/** Library */
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import styled from 'styled-components';

/** Components */
import {IconContainer, ShareIconContainer,Backdrop,BottomSheetContainer,ShareImgContainer, ButtonContainer } from './Container';
import {BottomTitle, BottomSubTitle} from './Text';
import { Whitebutton } from '../Button';

/** Hooks */
import React, { useCallback, useEffect, useState } from 'react';
import useDeviceType from '@/hooks/useDeviceType';
import Toast, { CustomToast } from './Toast';

/** Styles */

type shareType = {
    handleIsshare: () => void,
    handleCapture: () => void,
    capturedImage: string
}

export default function Share({capturedImage,handleCapture,handleIsshare}: shareType) {
    /**
     * 공유하기에 대한 개발노트 10.09
     * - X 공유하기 역시 가능. 따라서 이부분만 개발하면 될듯 함.
     */
    /**Hook Section */
    const device = useDeviceType();

    /**State Section */

    /**Effect Section */
    useEffect(() => {

    }, []);

    /**Function Section */
    const toastHandler = (text: string) => {
      toast.custom(
            (t) => (
                <CustomToast aria-live="polite">
                  <div>{text}</div>
                </CustomToast>
            ),
            { 
                duration: 1500 
            }
        );
    }
    const handleOnClickKakao = () => { //카카오톡 공유하기 핸들러
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
        toastHandler("공유하기가 완료되었어요.");
    }

    const handleCopyLink = async () => { //링크 클립보드 복사 함수
      await navigator.clipboard.writeText(String(process.env.NEXT_PUBLIC_DNS));
    };

    const handleShare = async () => { //링크 공유하기(시스템 바텀시트) 핸들러
      if(device === 'mobile' || device === 'tablet'){
        if (navigator.share) {
          try {
            await navigator.share({
              title: "ditto - 수백만의 스침 속, 단 하나의 멈춤",
              text: "4096개의 질문 중 저와 같은 질문을 선택한 사람은 8명이였습니다.",
              url: process.env.NEXT_PUBLIC_DNS,
            });
            toastHandler("공유하기가 완료되었어요.")
          } catch (err) {
            toastHandler("공유하기에 실패했어요.")
          }
      }}else {
          handleCopyLink();
          toastHandler("링크가 복사되었어요.")
      }

    };
    
    const shareText = "4096개의 질문 중 저와 같은 질문을 선택한 사람은 8명이였습니다. 단순한 우연일까요? 지금 여러분도 확인해보세요!";
    const shareUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const handleShareToX = useCallback(() => {
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(shareUrl);
        const intentUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(intentUrl, "_blank");
        toastHandler("공유하기가 완료되었어요.")
    }, [shareText, shareUrl]);



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
                onClick={()=>{
                  handleCapture();
                  toastHandler("이미지가 사진첩에 저장되었습니다.");
                }}
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
                <IconContainer
                    onClick={handleShareToX}
                >
                    <Image src='./icons/twitter.svg'
                           alt='link' width={24} height={32}/>
                </IconContainer>                
            </ShareIconContainer>            
        </ButtonContainer>
        <Toast />
      </BottomSheetContainer>
    </>
  );
}