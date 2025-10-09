"use client"

import { Blackbutton, BlackEnablebutton } from '@/components/Button'
import { Checkbox, Input } from '@/components/Input'
import Navbar from '@/components/Navbar'
import { BottomContainer, CheckContainer, MainContainer } from '@/components/register/Container'
import { Checklabel, SubtitleText, TitleText } from '@/components/register/Text'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import styled from 'styled-components'

export default function Register() {
    const router = useRouter();
    const [ischecked, setIschecked] = useState(false);
    const [isSubscribe, setIsSubscribe] = useState(false);

    const handleSubscribe = () => {
        /** 추후 이메일 저장 api 호출 */

        setIsSubscribe(true);
    }
    
  return (
    <>
        {isSubscribe && <Subscribe />}
        <Navbar 
            Prev={()=>{router.back()}}
            share={true}
        />
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
                        type='email'
                        placeholder='email@example.com'
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
                            onClick={handleSubscribe}
                            enable={ischecked}
                        >완료</BlackEnablebutton>
                    </BottomContainer>

                </MainContainer>
            </motion.div>
        </AnimatePresence>
    </>
  )
}

const SubContainer = styled.div`
    position: fixed;
    background-color: #F3F1EF;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;

    display: flex;
    justify-content: center;
    align-items: center;
`;

const AlertContainer = styled.div`
    padding: 32px;
    display: grid;
    gap: 17px;
`;

const Imgbox = styled.img`
    position: absolute;
`;

const SubscribeTitle = styled.h1`
    text-align: center;
    font-size: 30px;
`

const Subscribe = () => {
    const router = useRouter();

    return(
        <SubContainer>
            <Imgbox  src='/Container.svg'/>
            <AlertContainer>
                <SubscribeTitle>구독 완료!</SubscribeTitle>
                <SubtitleText>상대방의 의사를 여쭈어보고</SubtitleText>
                <SubtitleText>만남의 장소가 준비되면 알려드릴게요</SubtitleText>
                <Blackbutton
                    onClick={()=>{router.push('/')}}
                >처음으로</Blackbutton>
            </AlertContainer>
        </SubContainer>
    )
}