"use client"

/** Components */
import Navbar from "@/components/Navbar";
import { CaptuerContainer, MainContainer, LoadingContainer, TextContiner, ButtonContainer } from "@/components/result/Container";
import { LoadingText, SubtitleText, TitleText, ShareText } from "@/components/result/Text";
import Pyramid from "@/components/result/Pyramid";
import { Blackbutton } from "@/components/Button";
import Share from "@/components/result/Share";

/** Style */
import ScrollablePageStyle from "@/styles/ScrollablePageStyle";

/** Library */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import styled from "styled-components";
import { MatchService } from "@/api";

/** Dummy Data */
const TierText = [
  {
    ko: "슈퍼레어",
    en: "Super Rare",
    color: "#C93D2E"
  },
  {
    ko: "레어",
    en: "Rare",
    color: "#25459B"
  },
  {
    ko: "미디엄 레어",
    en: "Medium Rare",
    color: "#37607E"
  },
  {
    ko: "웰던",
    en: "Well-Done",
    color: "#775E4F"
  },
  
]

export default function Result() {
  /** Hook Section */
  const router = useRouter();
  const captureRef = useRef<HTMLDivElement>(null);

  /** State Section */
  const [isloading, setIsloading] = useState(true);
  const [isshare, setIsShare] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [tierIndex, setTierIndex] = useState<number>(0);
  const [similerUser, setSimilerUser] = useState<number>(0); //x%이상 일치한 사용자 수
  const [rarity, setRarity] = useState<number>(0); //게임 결과 희귀도


  /** Effect Section */
  useLayoutEffect(() => { //이미지 캡쳐를 위한 마운트 제어
    setTimeout(() => {
      handleCapture();
    }, 3100);
  }, []);

  useEffect(() => { //로딩 화면 제어
    const loadData = async() => {
          try{
            const rarityFetch =  MatchService.matchControllerCalculateResultRarity();
            const similerUserFetch =  MatchService.matchControllerGetSimilarUsersCount();

            
            const minLoadingTimePromise = new Promise((resolve) => setTimeout(resolve, 3000)); //최소 3초 로딩제한
            const [rarityResult, similarUserResult] = await Promise.all([rarityFetch,similerUserFetch, minLoadingTimePromise]);
            const similer = similarUserResult.data?.count;
            const rarityraw = rarityResult.data?.rarity;

            if(similer < 15) setTierIndex(0);
            else if (similer >= 15 && similer < 30) setTierIndex(1);
            else if (similer >= 30 && similer < 60) setTierIndex(2);
            else if (similer >= 60) setTierIndex(3);


            setSimilerUser(similer);
            setRarity(rarityraw);
          }catch(err){
            console.log(err);
          }finally{
            setIsloading(false);
          }
    }

    loadData();
  }, []);

  /** Funtion Section */
  const handleCapture = async () => { //이미지 자동 캡쳐
    if (!captureRef.current) return;

    const canvas = await html2canvas(captureRef.current, { useCORS: true });

    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);
  };

  const downloadImage = () => { //이미지 다운로드 함수
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = "ditto_result.png";
    link.click();
  };

  const handleIsshare = () => setIsShare((state) => !state); //공유 바텀시트 제어


  /** Return Section */
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
            {isshare && <Share 
                  capturedImage={capturedImage}
                  handleCapture={downloadImage}
                  handleIsshare={handleIsshare} />}
            <ScrollablePageStyle />
            <Navbar
              Prev={() => {
                router.push("/");
              }}
              shareHandle={handleIsshare}
              share={true}
            />
            <MainContainer>
              <CaptuerContainer ref={captureRef}>
              <TextContiner>
                <SubtitleText>당신의 선택은 {TierText[tierIndex].ko}합니다.</SubtitleText>
                <TitleText color={TierText[tierIndex].color}>{TierText[tierIndex].en}</TitleText>
              </TextContiner>

              <Pyramid 
                type={TierText[tierIndex].en}
                total={2037}
                number={8}
              />

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
              </CaptuerContainer>

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

