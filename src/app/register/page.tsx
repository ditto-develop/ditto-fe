"use client"

/** API */
import { UsersService } from '@/api'
import { downloadImage } from '@/common/ShareFunction'

/** Components */
import { MiddleBlackbutton, BlackEnablebutton } from '@/components/Button'
import { Checkbox, Input } from '@/components/Input'
import Navbar from '@/components/Navbar'
import { BottomContainer, CheckContainer, MainContainer, SubContainer, Imgbox, AlertContainer } from '@/components/register/Container'
import { Checklabel, SubtitleText, TitleText, SubscribeTitle, SubscribeText } from '@/components/register/Text'
import Share from '@/components/result/Share'
import { useAppContext } from '@/contexts/AppContext'

/** Library */
import { motion, AnimatePresence } from 'framer-motion'

/** Hook */
import { useRouter } from 'next/navigation'
import React, { ChangeEvent, useState } from 'react'

export default function Register() {
    /** Hook Section */
    const router = useRouter();
    const { capturedImg } = useAppContext();

    /** State Section */
    const [email, setEmail] = useState<string>('');
    const [ischecked, setIschecked] = useState<boolean>(false);
    const [isSubscribe, setIsSubscribe] = useState<boolean>(false);
    const [isshare, setIsShare] = useState(false);


    /** Function Section */
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        UsersService.usersControllerUpdateEmail({email: email})
            .then((res)=>{console.log("이메일 전송 성공", res)});

        setIsSubscribe(true);
    };

    const handleIsshare = () => setIsShare((state) => !state); //공유 바텀시트 제어


    
  return (
    <>
        {isSubscribe && <Subscribe />}
        {isshare && <Share 
                capturedImage={capturedImg}
                handleCapture={downloadImage}
                handleIsshare={handleIsshare} />}
        
        <Navbar 
            Prev={()=>{router.back()}}
            shareHandle={handleIsshare}
            share={true}
        />
        <form onSubmit={handleSubscribe}>
        <AnimatePresence mode='wait'>
            <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <MainContainer>
                    <div>
                        <TitleText>Register</TitleText>
                        <SubtitleText>이메일 한 줄만 남겨주세요. 만남의 소식이 있을 때,</SubtitleText>
                        <SubtitleText>새로운 선택지가 준비 될 때 알려드릴게요.</SubtitleText>
                    </div>


                    <Input 
                        onChange={handleChange}
                        type='email'
                        placeholder='email@example.com'
                        required
                    />

                    <BottomContainer>
                        <CheckContainer>
                            <Checkbox 
                                ischecked={ischecked}
                                setIschecked={setIschecked}
                            />
                            <Checklabel>만남과 선택지 소식을 이메일로 받는 것에 동의할게요.</Checklabel>
                        </CheckContainer>
                        <BlackEnablebutton
                            enable={ischecked}
                        >완료</BlackEnablebutton>
                    </BottomContainer>

                </MainContainer>
            </motion.div>
        </AnimatePresence>
        </form>
    </>
  )
}

const Subscribe = () => {
    const router = useRouter();

    return(
        <SubContainer>
            <Imgbox  src='/Container.svg'/>
            <AlertContainer>
                <SubscribeTitle>구독 완료!</SubscribeTitle>
                <div>
                    <SubscribeText>상대방의 의사를 여쭈어보고</SubscribeText>
                    <SubscribeText>만남의 장소가 준비되면 알려드릴게요</SubscribeText>
                </div>
                <MiddleBlackbutton
                    onClick={()=>{router.push('/')}}
                >처음으로</MiddleBlackbutton>
            </AlertContainer> 
        </SubContainer>
    )
}

