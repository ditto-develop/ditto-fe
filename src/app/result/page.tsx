"use client"

import Navbar from "@/components/Navbar";
import { MainContainer, LoadingContainer, TextContiner, ButtonContainer } from "@/components/result/Container";
import { useEffect, useState } from "react";
import { LoadingText, SubtitleText, TitleText, ShareText } from "@/components/result/Text";
import Pyramid from "@/components/result/Pyramid";
import ScrollablePageStyle from "@/styles/ScrollablePageStyle";
import { Blackbutton } from "@/components/Button";
import Share from "@/components/result/Share";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Result() {
  const router = useRouter();
  const [isloading, setIsloading] = useState(true);
  const [isshare, setIsShare] = useState(false);

  const handleIsshare = () => setIsShare((state) => !state);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsloading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isloading ? (
            <LoadingContainer>
              <LoadingText>Loading</LoadingText>
            </LoadingContainer>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {isshare && <Share handleIsshare={handleIsshare} />}
            <ScrollablePageStyle />
            <Navbar
              Prev={() => {
                router.push("/");
              }}
              shareHandle={handleIsshare}
              share={true}
            />
            <MainContainer>
              <TextContiner>
                <SubtitleText>당신은 슈퍼레어합니다.</SubtitleText>
                <TitleText>Super Rare</TitleText>
              </TextContiner>

              <Pyramid type="superrare" />

              <div>
                <div>
                  <SubtitleText>4096개의 질문 중</SubtitleText>
                  <SubtitleText>당신과 같은 질문을 선택한 사람들은</SubtitleText>
                  <SubtitleText>8명이였습니다.</SubtitleText>
                </div>

                <div style={{ marginTop: "30px" }}>
                  <SubtitleText>단순한 우연일까요, 가치관의 일치일까요?</SubtitleText>
                  <SubtitleText>아니면 어떤 공통의 끌림 일지도 모르죠.</SubtitleText>
                  <SubtitleText>그들은 어떤 사람들일까요?</SubtitleText>
                </div>
              </div>

              <ButtonContainer>
                <Blackbutton
                  onClick={()=>{router.push('/register')}}
                >궁금해요</Blackbutton>
                <ShareText onClick={handleIsshare}>친구들에게만 공유하기</ShareText>
              </ButtonContainer>
            </MainContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
