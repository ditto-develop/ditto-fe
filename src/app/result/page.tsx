"use client"

/** Components */
import Navbar from "@/components/Navbar";
import { CaptuerContainer, MainContainer, LoadingContainer, TextContiner, ButtonContainer, TextContainer } from "@/components/result/Container";
import TypingEffect, { SubtitleText, TitleText, ShareText, BottomSubTitle, ButtonTitleText } from "@/components/result/Text";
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
  const [isshare, setIsShare] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gameResult, setGameResult] = useState<gameresultType>();
  const [step, setStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);

  /** Effect Section */
  useEffect(() => { //화면 Init
    const loadData = async() => {
      try{
        const matchResult =  await MatchService.matchControllerGetSimilarUsersCount(1,80); //최종 매치 결과
        setGameResult(matchResult.data as gameresultType);
      }catch(err){
        console.log(err);
      }
    };

    loadData();

  }, []);

  useEffect(() => {
    if (step >= 4) {
      setTimeout(() => setIsVisible(false), 700); // fade-out 끝난 뒤 제거
    }
  }, [step]);

  /** Funtion Section */
  const handleIsshare = () => setIsShare((state) => !state); //공유 바텀시트 제어


  /** Return Section */
  return (
    <>
            {isshare && <Share 
                  handleIsshare={handleIsshare} />}
          <AnimatePresence mode="wait" >
                <motion.div
                    initial={{opacity: 0 }}
                    animate={{opacity: 1}}   
                    exit={{opacity: 0 }} 
                    transition={{ duration: 0.6 }}
                >
            <ScrollablePageStyle />

            <Navbar
              Prev={() => {
                router.push("/");
              }}
              shareHandle={handleIsshare}
              share={true}
            />

            <MainContainer>
              {isVisible && 
              <TextContainer hidden={step >= 4}>
                <div style={{gap: '8px',display: 'grid'}}>
                  {
                    step >= 0 &&
                    <TypingEffect
                      text="당신과 답변이 일치하는 사람은..."
                      speed={120} 
                      onFinish={()=>{setStep(1)}}
                    />
                  }
                  {
                    step >= 1 &&
                    <TitleText
                        style={{ animationDelay: "0.6s" }}
                        onAnimationEnd={() => setStep(2)}
                    >8명</TitleText>
                  }
                </div>
                <div style={{gap: '8px',display: 'grid'}}>
                  {
                    step >= 2 &&
                    <TypingEffect
                      text="이렇게 선택할 확률은..."
                      speed={120}
                      onFinish={()=>{setStep(3)}}
                    />
                  }
                  {
                    step >= 3 &&
                    <TitleText
                        style={{ animationDelay: "0.6s" }}
                        onAnimationEnd={() => setStep(4)}
                    >0.39%</TitleText>
                  }
                </div>
              </TextContainer>
              }

              <TextContainer>
                <div>
                  { step >= 4 && <SubtitleText style={{ animationDelay: "0.6s" }} onAnimationEnd={() => setStep(5)}>당신과 같은 선택을 한 사람은 단 8명.</SubtitleText>}
                  { step >= 5 && <SubtitleText style={{ animationDelay: "0.6s" }} onAnimationEnd={() => setStep(6)}>단순한 우연일까요, 가치관의 일치일까요?</SubtitleText>}
                  { step >= 6 && <SubtitleText style={{ animationDelay: "0.6s" }} onAnimationEnd={() => setStep(7)}>그들은 당신처럼 생각하고, 웃고, 고민하는 사람들</SubtitleText>}
                  { step >= 7 && <SubtitleText style={{ animationDelay: "0.6s" }} onAnimationEnd={() => setStep(8)}>일지도 몰라요.</SubtitleText>}
                </div>
              </TextContainer>
              {step >= 8 &&
                <ButtonContainer>
                  <ButtonTitleText>나와 같은 사람들, 만나볼까요?</ButtonTitleText>
                  <Blackbutton
                    onClick={()=>{router.push('/register')}}
                  >네</Blackbutton>
                  <ShareText onClick={handleIsshare}>친구들에게만 공유하기</ShareText>
                </ButtonContainer>
              }
            </MainContainer>
          </motion.div>
        </AnimatePresence>
    </>
  );
}

