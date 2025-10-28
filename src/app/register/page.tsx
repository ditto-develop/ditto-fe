"use client"

/** API */
import { UsersService } from '@/api'

/** Components */
import { MiddleBlackbutton, BlackEnablebutton } from '@/components/Button'
import { Checkbox, Input } from '@/components/Input'
import Navbar from '@/components/Navbar'
import { BottomContainer, CheckContainer, MainContainer, SubContainer, Imgbox, AlertContainer, LogoContainer } from '@/components/register/Container'
import { Checklabel, SubtitleText, TitleText, SubscribeTitle, SubscribeText } from '@/components/register/Text'
import Share from '@/components/result/Share'

/** Library */
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

/** Hook */
import { useRouter } from 'next/navigation'
import React, { ChangeEvent, useState } from 'react'

export default function Register() {
    /** Hook Section */
    const router = useRouter();

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
        const nowISO = new Date().toISOString();

        UsersService.usersControllerUpdateEmail({email: email, marketingAgreement: true, marketingAgreedAt: nowISO})
            .then((res)=>{});

        setIsSubscribe(true);
    };

    const handleIsshare = () => setIsShare((state) => !state); //공유 바텀시트 제어


    
  return (
    <>
        {isSubscribe && <Subscribe />}
        {isshare && <Share 
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
                        <LogoContainer 
                            src='/titles/register.svg'
                            alt='register'
                        />
                        <SubtitleText>답이 비슷했을 뿐인데, 생각보다 잘 맞을지도 몰라요.</SubtitleText>
                        <SubtitleText>이메일을 남기면 새로운 사람들과 이어질 수 있어요.</SubtitleText>
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
                    <SubscribeText>새로운 만남이 준비되는 순간을 기다려주세요.</SubscribeText>
                </div>
                <MiddleBlackbutton
                    onClick={()=>{router.push('/')}}
                >처음으로</MiddleBlackbutton>
            </AlertContainer> 
        </SubContainer>
    ) 
}

