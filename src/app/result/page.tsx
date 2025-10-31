"use client"

/** Hooks */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Components */
import Navbar from "@/components/Navbar";
import { MainContainer, ButtonContainer, TextContainer, Line, variants, Textmotion, textvariants } from "@/components/result/Container";
import {TypingEffect, ShareText, TypingColorEffect, IntegerCounter, FloatCounter, BaseText, ResultNormal, ResultSmallColor, ResultBigColor } from "@/components/result/Text";
import { Blackbutton } from "@/components/Button";
import Share from "@/components/result/Share";

/** Style */
import ScrollablePageStyle from "@/styles/ScrollablePageStyle";

/** Library */
import { motion, AnimatePresence } from "framer-motion";

/** API */
import { MatchService, UsersService } from "@/api";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { setSteper } from "@/store/stepSlice";
import { setSamecount } from "@/store/sameCountSlice";

/** Types */
type gameresultType = {
    totalCount: number,
    similarCount: number,
    sameCount: number
}

export default function Result() {
  /** Hook Section */
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  /** Store Section */
  const isStep = useSelector((state: RootState) => state.step);
  const sitemap = useSelector((state: RootState) => state.where);

  /** State Section */
  const [typespeed, setTypespeed] = useState<number>(45);
  const [isshare, setIsShare] = useState(false);
  const [gameResult, setGameResult] = useState<gameresultType>();
  const [step, setStep] = useState<number>(isStep.value?7:0);
  const [pControls, setPControls] = useState<number[]>([0, 0, 0]);


  /** Effect Section */
  useEffect(() => { //화면 Init
    /** 이용가능 여부 검사 */
    if(sitemap.where !== 'result' && sitemap.where !== 'register') router.push('/'); 

    if(isStep.value) {
      updatePControl(0,48);
      updatePControl(1,48);
      updatePControl(2,48);
    };
    
    const loadData = async() => {
      try{
        const matchResult =  await MatchService.matchControllerGetSimilarUsersCount(1,80); //최종 매치 결과
        setGameResult(matchResult.data as gameresultType);
        dispatch(setSamecount(matchResult.data?.sameCount));
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

  const lineAnimation = {
    initial: "hidden",
    animate: "visible",
    exit: "hidden",
    variants,
    layout: true,
  };

  const textMotionAnimation = {
    initial: "hidden",
    animate: "visible",
    exit: "hidden",
    variants: textvariants(),
    layout: true,
  };

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
                  {isStep.value ? (
                    // ✅ 정적 결과 화면
                    <>
                      <ResultNormal>당신과 같은 선택을 한 사람은...</ResultNormal>
                      <ResultSmallColor>{gameResult?.totalCount}명 중</ResultSmallColor>
                      <ResultBigColor>{gameResult?.similarCount || 8}명</ResultBigColor>
                    </>
                  ) : (
                    // ✅ 애니메이션 단계
                    <>
                      {step >= 0 && (
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
                            onFinish={() => setStep(1)}
                          />
                        </Line>
                      )}

                      {step >= 1 && (
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
                            text={`${gameResult?.totalCount}명 중`}
                            speed={typespeed}
                            onFinish={() => setStep(2)}
                          />
                        </Line>
                      )}

                      {step >= 2 && (
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
                            onFinish={() => setStep(3)}
                          />
                        </Line>
                      )}
                    </>
                  )}

                </div>
                <div style={{ gap: '8px', display: 'grid' }}>
                {isStep.value ? (
                  <>
                    <ResultNormal>이렇게 선택할 확률은...</ResultNormal>
                    <ResultBigColor>
                      {((gameResult?.similarCount / gameResult?.totalCount) * 100).toFixed(1)}%
                    </ResultBigColor>
                  </>
                ) : (
                  <>
                    {step >= 3 && (
                      <Line key="line-3" {...lineAnimation}>
                        <TypingEffect
                          text="이렇게 선택할 확률은..."
                          speed={typespeed}
                          onFinish={() => setStep(4)}
                        />
                      </Line>
                    )}

                    {step >= 4 && (
                      <Line key="line-4" {...lineAnimation}>
                        <FloatCounter
                          target={(gameResult?.similarCount / gameResult?.totalCount) * 100}
                          onFinish={() => {
                            setTimeout(() => {
                              setStep(5);
                              updatePControl(0, 48);
                            }, 250);
                          }}
                        />
                      </Line>
                    )}
                  </>
                )}
              </div>
              </TextContainer>

              <TextContainer padding={pControls[1]}>
                {isStep.value ? (
                  <div style={{display: 'grid', gap: '8px'}}>
                    <ResultNormal>단순한 우연일까요, 가치관의 일치일까요?</ResultNormal>
                    <ResultNormal>그들은 당신처럼 생각하고, 웃고,</ResultNormal>
                    <ResultNormal>고민하는 사람들일지도 몰라요.</ResultNormal>
                  </div>
                ) : (
                  <>
                    {step >= 5 && (
                      <Textmotion
                        key="line-5"
                        {...textMotionAnimation}
                        onAnimationComplete={() => {
                          setTimeout(() => {
                            setStep(6);
                            updatePControl(1, 48);
                          }, 250);
                        }}
                      >
                        <BaseText>단순한 우연일까요, 가치관의 일치일까요?</BaseText>
                        <BaseText>그들은 당신처럼 생각하고, 웃고,</BaseText>
                        <BaseText>고민하는 사람들일지도 몰라요.</BaseText>
                      </Textmotion>
                    )}
                  </>
                )}
              </TextContainer>
              <TextContainer padding={pControls[2]}>
                {isStep.value ? (
                  <ResultNormal>나와 같은 사람들, 만나볼까요?</ResultNormal>
                ) : (
                  <>
                    {step >= 6 && (
                      <Textmotion
                        key="line-6"
                        {...textMotionAnimation}
                        onAnimationComplete={() => {
                          setTimeout(() => {
                            setStep(7);
                            dispatch(setSteper(true));
                            updatePControl(2, 48);
                          }, 250);
                        }}
                      >
                        <BaseText>나와 같은 사람들, 만나볼까요?</BaseText>
                      </Textmotion>
                    )}
                  </>
                )}
              </TextContainer>

              {isStep.value ? (
                <ButtonContainer>
                  <Blackbutton onClick={() => {
                    UsersService.usersControllerSaveIsArrived();
                    router.push('/register');
                  }}>네</Blackbutton>
                  <ShareText onClick={handleIsshare}>친구들에게만 공유할래요</ShareText>
                </ButtonContainer>
              ) : (
                <>
                  {step >= 7 && (
                    <Line key="line-7" {...lineAnimation}>
                      <ButtonContainer>
                        <Blackbutton onClick={() => router.push('/register')}>네</Blackbutton>
                        <ShareText onClick={handleIsshare}>친구들에게만 공유할래요</ShareText>
                      </ButtonContainer>
                    </Line>
                  )}
                </>
              )}
            </MainContainer>
          </motion.div>
        </AnimatePresence>
    </>
  );
}

