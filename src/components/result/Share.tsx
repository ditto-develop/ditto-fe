
/** Library */
import Image from 'next/image';
import toast from 'react-hot-toast';

/** Components */
import {IconContainer, ShareIconContainer,Backdrop,BottomSheetContainer, ButtonContainer } from './Container';
import {BottomTitle, BottomSubTitle} from './Text';

/** Hooks */
import React, { useCallback, useEffect, useState } from 'react';
import useDeviceType from '@/hooks/useDeviceType';
import Toast, { CustomToast } from './Toast';
import { UsersService } from '@/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

/** Styles */
type shareType = {
    handleIsshare: () => void,
} 

export default function Share({handleIsshare}: shareType) {
    /**Store Section */
    const similCount = useSelector((state: RootState) => state.samecount.count);

    /**Hook Section */
    const device = useDeviceType();

    /**State Section */
    const [shareUrls, setShareUrls] = useState<string>('');

    /**Effect Section */
    useEffect(() => { 
        const initUrl = () => {
          UsersService.usersControllerInvite().then(
            (res)=>{
                const url = res.data?.referralLink;
                setShareUrls(String(url));
            }
          )
        };

        initUrl();
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

    /** 카카오톡 공유하기 utm/referal 링크를 적용하기 귀해 구조를 변경해야 함 */
    const handleOnClickKakao = () => { //카카오톡 공유하기 핸들러
        if (typeof window === "undefined" || !window.Kakao) {
          
          return;
        }

        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
        }

        const url = shareUrls + '?utm=\'kakao\''
 
        window.Kakao.Share.sendDefault({
              objectType: 'feed',
              content: {
                title: '',
                description: '4096개의 조합 중에 나와 같은 사람은 ' + similCount+'명이었어. 너와 같은 사람은 몇 명이나 될까?',
                imageUrl:
                  'https://i.postimg.cc/FFJPz8K0/OG-Image.png',
                link: {
                  mobileWebUrl: url,
                  webUrl: url,
                },
              },
              buttons: [
                {
                  title: '자세히 보기',
                  link: {
                    mobileWebUrl: url,
                    webUrl: url,
                  },
                }
              ],
        });

        toastHandler("카카오톡을 실행합니다.");
    }

    const handleCopyLink = async () => { //링크 클립보드 복사 함수
      const url = shareUrls + '?utm=\'clipboard\''
      await navigator.clipboard.writeText(String(url));
    };

    const handleShare = async () => { //링크 공유하기(시스템 바텀시트) 핸들러
      const url = shareUrls + '?utm=\'bottomsheet\''
      if(device === 'mobile' || device === 'tablet'){
        if (navigator.share) {
          try {
            await navigator.share({
              title: "ditto -  12개의 선택, 하나의 만남",
              text: "4096개의 조합 중에 나와 같은 사람은 "+similCount+ "명이었어. 너와 같은 사람은 몇 명이나 될까?",
              url: url,
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
    
    const shareText = "ditto - 12개의 선택, 하나의 만남";
    const shareUrl = shareUrls || '';

    const handleShareToX = useCallback(() => { //X 공유하기용 함수
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(shareUrl+'?\'x\'');
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
                    draggable="false" 
                    onClick={handleIsshare}
                    src='/icons/x.svg'
                    style={{cursor: 'pointer'}}
                    alt='x icons'
                    width={24}
                    height={24}
                />
            </div>
            <div>
                <BottomSubTitle>나와 비슷한 사람, 같이 찾아볼까요?</BottomSubTitle>
                <BottomSubTitle>이 링크가 새로운 친구를 이어줄지도 몰라요.</BottomSubTitle>
            </div>
        </div>
        <ButtonContainer>
            <ShareIconContainer>
                <IconContainer
                    onClick={handleShare}
                >
                    <Image src='./icons/link.svg'
                            draggable="false" 
                           alt='link' width={32} height={32}/>
                </IconContainer>
                <IconContainer
                    onClick={handleOnClickKakao}
                >
                    <Image src='./icons/chat.svg'
                          draggable="false" 
                           alt='chat' width={24} height={32}/>
                </IconContainer>
                <IconContainer
                    onClick={handleShareToX}
                > 
                    <Image src='./icons/twitter.svg'
                            draggable="false" 
                           alt='twitter' width={24} height={32}/>
                </IconContainer>                
            </ShareIconContainer>            
        </ButtonContainer>
        <Toast />
      </BottomSheetContainer>
    </>
  );
}