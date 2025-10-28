
/** Library */
import Image from 'next/image';
import toast from 'react-hot-toast';

/** Components */
import {IconContainer, ShareIconContainer,Backdrop,BottomSheetContainer, ButtonContainer } from './Container';
import {BottomTitle, BottomSubTitle} from './Text';

/** Hooks */
import React, { useCallback, useEffect } from 'react';
import useDeviceType from '@/hooks/useDeviceType';
import Toast, { CustomToast } from './Toast';

/** Styles */
type shareType = {
    handleIsshare: () => void,
} 

export default function Share({handleIsshare}: shareType) {
    /**Hook Section */
    const device = useDeviceType();

    /**State Section */

    /**Effect Section */
    useEffect(() => {

    }, []);

    /**Function Section */
    const toastHandler = (text: string) => { //Toast 생성 함수
      toast.custom(
            () => (
                <CustomToast aria-live="polite">
                  <div>{text}</div>
                </CustomToast>
            ),
            { 
                duration: 1500 
            }
        );
    };

    const handleOnClickKakao = () => { //카카오톡 공유하기 핸들러
        if (typeof window === "undefined" || !window.Kakao) {
          
          return;
        }

        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
        }
 
        window.Kakao.Share.sendCustom({
            templateId: 124986,
            templateArgs: { //전체 인원/선택 인원 파라미터로 전달 (수정예정)
              totalcount: 4096,
              samecount: 8
            },
        });

        toastHandler("카카오톡을 실행합니다.");
    }

    const handleCopyLink = async () => { //링크 클립보드 복사 함수
      await navigator.clipboard.writeText(String(process.env.NEXT_PUBLIC_DNS));
    };

    const handleShare = async () => { //링크 공유하기(시스템 바텀시트) 핸들러
      if(device === 'mobile' || device === 'tablet'){
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Ditto -  12개의 선택, 하나의 만남",
              text: "4096개의 조합 중에 나와 같은 사람은 8명이었어. 너와 같은 사람은 몇 명이나 될까?",
              url: process.env.NEXT_PUBLIC_DNS,
            });
            toastHandler("공유하기가 완료되었습니다.")
          } catch (err) {
            console.error(err);
            toastHandler("공유하기를 실패했습니다.")
          }
      }}else {
          handleCopyLink();
          toastHandler("링크가 복사되었습니다.")
      }

    };
    
    const shareText = "12개의 선택, 하나의 만남";
    const shareUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const handleShareToX = useCallback(() => { //X 공유하기용 함수
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(shareUrl);
        const intentUrl = `https://x.com/intent/tweet?text=${text}&url=${url}`;
        window.open(intentUrl, "_blank");
        toastHandler("공유하기가 완료되었습니다.");
    }, [shareText, shareUrl]);



  return (
    <>
      <Backdrop onClick={handleIsshare} />
      <BottomSheetContainer>
        <div style={{display: "grid", gap: "10px"}}>
            <div style={{display: "flex", justifyContent: "space-between", position: 'relative' }}>
                <BottomTitle>링크 공유하기</BottomTitle>
                <Image 
                    onClick={handleIsshare}
                    src='/icons/x.svg'
                    alt='x icons'
                    width={24}
                    height={24}
                />
            </div>
            <div>
                <BottomSubTitle>나와 비슷한 사람, 같이 찾아볼까요?</BottomSubTitle>
                <BottomSubTitle>이 링크가 당신과 같은 사람을 이어줄지도 몰라요.</BottomSubTitle>
            </div>
        </div>
        <ButtonContainer>
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
                           alt='chat' width={24} height={32}/>
                </IconContainer>
                <IconContainer
                    onClick={handleShareToX}
                >
                    <Image src='./icons/twitter.svg'
                           alt='twitter' width={24} height={32}/>
                </IconContainer>                
            </ShareIconContainer>            
        </ButtonContainer>
        <Toast />
      </BottomSheetContainer>
    </>
  );
}