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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas-pro";

/** API */
import { MatchService, SuccessApiResponse, UsersService } from "@/api";

/** Context */
import { useAppContext } from "@/contexts/AppContext";
import { downloadImage } from "@/common/ShareFunction";

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

/** Type Section */
type gameresultType = {
    totalCount: number,
    similarCount: number,
    sameCount: number
}

export default function Result() {
  /** Hook Section */
  const { capturedImg, setCapturedImg } = useAppContext();
  const router = useRouter();
  const captureRef = useRef<HTMLDivElement>(null);

  /** State Section */
  const [isloading, setIsloading] = useState(true);
  const [isshare, setIsShare] = useState(false);
  const [tierIndex, setTierIndex] = useState<number>(0);

  const [gameResult, setGameResult] = useState<gameresultType>();

  /** Effect Section */
  useEffect(() => { //로딩 화면 제어
    const loadData = async() => {
      async function handleCapture(): Promise<string | undefined> { //캡쳐 핸들러
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!captureRef.current) throw new Error("captureRef가 비어있습니다.");

        try {
          console.log("🖼️ 이미지 캡쳐 시작");
          const canvas = await html2canvas(captureRef.current, { useCORS: true });
          const dataUrl = canvas.toDataURL("image/png");

          const byteString = atob(dataUrl.split(",")[1]);
          const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }

          const blob = new Blob([ab], { type: mimeString });
          console.log("✅ 캔버스 -> blob 변환 성공");
          console.log(blob);

          // await the upload directly and validate the response before using .data
          const uploadResponse = await UsersService.usersControllerUploadGameResultImage(1, { file: blob });
          const result = uploadResponse as unknown as SuccessApiResponse | undefined;
          if (!result || !result.data || !result.data.url) {
            console.error("❌ 서버 업로드 실패 또는 응답에 URL이 없습니다.", result);
            return undefined;
          }

          const imgURL = result.data.url;
          const imgLink = process.env.NEXT_PUBLIC_API_URL + imgURL;
          console.log("✅ 서버 업로드 성공", imgLink);
          
          setCapturedImg(imgLink);

          return imgLink;
        } catch (error) {
          console.error("❌ 이미지 캡쳐 또는 업로드 실패:", error);
          return undefined;
        }
      };

      /** Loading Promise 처리 */
      try{
        /** Promise Section */
        const matchResult =  MatchService.matchControllerGetSimilarUsersCount(1,80); //최종 매치 결과
        const capturePromise = handleCapture();
        const minLoadingTimePromise = new Promise((resolve) => setTimeout(resolve, 3000)); //최소 3초 로딩제한

        const [matchres] = await Promise.all([matchResult,capturePromise, minLoadingTimePromise]); // 병렬처리

        /** 데이터 가공 (totalCount : 전체 참여자 명수 / similarCount : 비슷한 답변을 한 인원 수(기준80) / similer : 비슷한 인원 비율 (단위 %)) */
        const totalCount = matchres.data?.totalCount;
        const similarCount = matchres.data?.similarCount;
        const similer = similarCount/totalCount * 100 ;
        
        /** 티어표 셋팅 (피라미드 수정 예정) */
        if(similer < 15) setTierIndex(0);
        else if (similer >= 15 && similer < 30) setTierIndex(1);
        else if (similer >= 30 && similer < 60) setTierIndex(2);
        else if (similer >= 60) setTierIndex(3);

        /** 최종 결과 셋팅 */
        setGameResult(matchres.data as gameresultType);

      }catch(err){
        console.log(err);
      }finally{
        setIsloading(false);
      }
    }
    loadData();
  }, []);

  /** Funtion Section */
  

  const handleIsshare = () => setIsShare((state) => !state); //공유 바텀시트 제어


  /** Return Section */
  return (
    <>
      <AnimatePresence mode="wait">
        {isloading && 
          <LoadingContainer>
            <LoadingText>Loading</LoadingText>
          </LoadingContainer>}
        
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              display: "static",
              top: 0,
              left: 0,
              width: "100%",
              pointerEvents: isloading ? "none" : "auto", // 로딩 중에는 클릭 방지
            }}
          >
            {isshare && <Share 
                  capturedImage={capturedImg}
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
                total={gameResult?.totalCount || 2024}
                number={gameResult?.similarCount || 8}
              />

              <div>
                  <div>
                    <SubtitleText>4096개의 질문 중</SubtitleText>
                    <SubtitleText>당신과 같은 질문을 선택한 사람들은</SubtitleText>
                    <SubtitleText>{gameResult?.sameCount}명이였습니다.</SubtitleText>
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
      </AnimatePresence>
    </>
  );
}

