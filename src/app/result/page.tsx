"use client"

/** Hooks */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Components */
import Navbar from "@/components/Navbar";
import { MainContainer, ButtonContainer, TextContainer, Line, variants, Textmotion, textvariants } from "@/components/result/Container";
import {TypingEffect, ShareText, TypingColorEffect, IntegerCounter, FloatCounter, BaseText } from "@/components/result/Text";
import { Blackbutton } from "@/components/Button";
import Share from "@/components/result/Share";

/** Style */
import ScrollablePageStyle from "@/styles/ScrollablePageStyle";

/** Library */
import { motion, AnimatePresence } from "framer-motion";

/** API */
import { MatchService } from "@/api";

/** Types */
type gameresultType = {
    totalCount: number,
    similarCount: number,
    sameCount: number
}

export default function Result() {
  /** Hook Section */
  const router = useRouter();

  /** State Section */
  const [typespeed, setTypespeed] = useState<number>(45);
  const [isshare, setIsShare] = useState(false);
  const [gameResult, setGameResult] = useState<gameresultType>();
  const [step, setStep] = useState<number>(0);
  const [pControls, setPControls] = useState<number[]>([0, 0, 0]);

  /** Effect Section */
  useEffect(() => { //화면 Init
    const loadData = async() => {
      try{
        const matchResult =  await MatchService.matchControllerGetSimilarUsersCount(1,80); //최종 매치 결과
        setGameResult(matchResult.data as gameresultType);
      }catch(err){

      }
    };

    loadData();

  }, []);

  /** Funtion Section */
  const updatePControl = (index: number, value: number) => { //pControls 상태관리용 함수
    setPControls(prev => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };

  const handleIsshare = () => setIsShare((state) => !state); //공유 바텀시트 제어
  if(!gameResult) return <></>;

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
 
            <MainContainer $isFinsihed={step >= 7 ? true : false}>

              <TextContainer padding={pControls[0]}>
                <div style={{gap: '8px',display: 'grid'}}>
                  {
                    step >= 0 &&(
                        <Line
                          key="line-0"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={variants}
                          layout 
                        >
                          <TypingEffect
                            text="당신과 같은 선택을 한 사람은..."
                            speed={typespeed} 
                            onFinish={()=>{setStep(1)}}
                          />
                      </Line>
                    )
                  }
                  {
                    step >= 1 &&(
                        <Line
                          key="line-1"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={variants}
                          layout 
                        >
                          <TypingColorEffect 
                              color="#775E4F"
                              text={gameResult?.totalCount+"명 중"}
                              speed={typespeed} 
                              onFinish={()=>{setStep(2)}}
                          />
                        </Line>
                    )
                  }
                  {
                    step >= 2 &&(
                        <Line
                          key="line-2"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={variants}
                          layout 
                        >
                    <IntegerCounter
                        target={gameResult?.similarCount || 8}
                        onFinish={()=>{setStep(3)}}
                    /></Line>)
                  }
                </div>
                <div style={{gap: '8px',display: 'grid'}}>
                  {
                    step >= 3 &&(
                        <Line
                          key="line-3"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={variants}
                          layout 
                        >
                    <TypingEffect
                      text="이렇게 선택할 확률은..."
                      speed={typespeed} 
                      onFinish={()=>{setStep(4)}}
                    /></Line>)
                  }
                  {
                    step >= 4 &&(
                        <Line
                          key="line-4"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={variants}
                          layout 
                        >
                    <FloatCounter
                        target={gameResult?.similarCount/gameResult?.totalCount*100}
                        onFinish={()=>{
                          setTimeout(()=>{
                            setStep(5);
                            updatePControl(0,48);
                          },250);
                        }}
                    /></Line>)
                  }
                </div>
              </TextContainer>

              <TextContainer padding={pControls[1]}>
                  {
                    step >= 5 &&(
                    <Textmotion
                      key="line-5"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={textvariants()}
                      layout 
                      onAnimationComplete={() => {
                            setTimeout(()=>{
                              setStep(6);
                              updatePControl(1, 48);
                            },250);
                      }}
                    >
                        <BaseText>단순한 우연일까요, 가치관의 일치일까요?</BaseText>
                        <BaseText>그들은 당신처럼 생각하고, 웃고,</BaseText>
                        <BaseText>고민하는 사람들일지도 몰라요.</BaseText>
                    </Textmotion>)
                  }
              </TextContainer>
              <TextContainer padding={pControls[2]}>
                {
                    step >= 6 &&(
                    <Textmotion
                      key="line-8"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={textvariants()}
                      layout 
                      onAnimationComplete={() => {
                          setTimeout(() => {
                            setStep(7);
                            updatePControl(2, 48);
                          }, 250);
                      }}
                    >
                      <BaseText>나와 같은 사람들, 만나볼까요?</BaseText>
                    </Textmotion>)
                }
              </TextContainer>

              {step >= 7 &&(
                        <Line
                          key="line-9"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={variants}
                          layout 
                        >
                <ButtonContainer>
                  <Blackbutton
                    onClick={()=>{router.push('/register')}}
                  >네</Blackbutton>
                  <ShareText onClick={handleIsshare}>친구들에게만 공유할래요</ShareText>
                </ButtonContainer></Line>)
              }
            </MainContainer>
          </motion.div>
        </AnimatePresence>
    </>
  );
}

