"use client"

/** Components */
import { QuizButton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import {MainContainer,InfomationContainer,ButtonContainer} from "@/components/quiz/Container";
import { QuizText } from "@/components/quiz/Text";

/** hooks */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** library */
import { motion, AnimatePresence } from "framer-motion";

/** API */
import { GameService } from "@/api";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { setWhere } from "@/store/sitemapSlice";

/** types */
type Question = {
  id: string;
  round: number;
  index: number;
  text: string;
  options: { index: string; label: string }[];
};

type SuccessApiResponseWithData = {
  success: boolean;
  data: Question[];
};

export default function Quiz() {
    /** Hook Section */
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    /** State Section */
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizindex, setQuizindex] = useState<number>(0);
    const [moved, setMoved] = useState<number>(0);
    const [disabled, setDisabled] = useState(false); //뒤로가기 연속터치 방지용
    const [isClient, setIsClient] = useState(false); // 클라이언트 렌더링 플래그
    const [isLoading, setIsLoading] = useState(true); // 서버셋팅 렌더링 플래그

    /** Store Section */
    const sitemap = useSelector((state: RootState) => state.where);

    /** Effect Section */
    useEffect(()=>{ //첫 화면 Init시 작동
        /** 이용가능 여부 검사 */
        if(sitemap.where !== 'quiz') router.push('/'); 

        setIsClient(true);

        GameService.gameControllerGetQuestions(1) //퀴즈정보 호출 gameControllerGetQuestions(round: number)
            .then((res) => {
                const result = res as SuccessApiResponseWithData;
                setQuestions(result.data);
                setIsLoading(false);
            })
        
        SetQuizData(1);
    },[])

    /** Function Section */
    const SetQuizData = (i: number) => {   //퀴즈 정보 셋팅      
        const index = i-1;
        setQuizindex(index);
    }

    const ClickedAns = (isLeft: boolean) => { //답변 입력 함수 
        const ansData = {
            round: 1, //임시지정 (라운드가 변화할 시 변수로 사용 예정)
            questionId: questions[quizindex].id,
            requestBody: {
                selectedIndex: isLeft ? 0 : 1
            }
        }
        if(quizindex !== 11) setMoved(isLeft?-1:1);   

        GameService.gameControllerSubmitAnswers( //답변제출 API
          ansData.round,
          ansData.questionId,
          ansData.requestBody)
            .then(()=>{
                if(quizindex === 11) { //12문제 종료시 (quizindex 11) 종료 API 호출 후 결과창 이동
                    try{
                        dispatch(setWhere('result'));
                        GameService.gameControllerSubmitEnd(1)
                            .then((res) => {
                                const result = res as SuccessApiResponseWithData;
                            });
                        router.push('/result');
                    }catch(err){
                        console.error(err);
                    }
                    return;
                }else{
                    SetQuizData(questions[quizindex].index+1);
                    setMoved(0);
                };
            })
            .catch((err)=>{
                console.error("에러발생",err);
          });
    };

    const PrevQuiz = () => { //이전 퀴즈로 돌아가는 함수
        if (disabled) return;
        if (quizindex === 0){
            router.back();
            return;
        } 
        setDisabled(true);
        setQuizindex((prev) => prev - 1);
        setTimeout(() => setDisabled(false), 700);     
    };
    

    /** Return Section */
    if (!isClient || isLoading) return <div />; // ✅ 서버와 클라이언트의 초기 HTML을 일치시킴


    return (
        <>
        <Navbar Prev={PrevQuiz}/>
            <div style={{overflow: "hidden", width:"100%"}}>
            <AnimatePresence mode="wait" custom={moved}>
                <motion.div
                    key={questions[quizindex].index} 
                    custom={moved}
                    initial={{opacity: 0 }}
                    animate={{ opacity: 1}}   
                    exit={{opacity: 0 }} 
                    transition={{ duration: 0.5 }}
                >
                    <MainContainer>
                        <InfomationContainer>
                            <p style={{textAlign: "center", fontWeight: "500", fontSize: "18px"}}>
                                {questions[quizindex].index}/{12}
                            </p>
                            <QuizText>{questions[quizindex].text}</QuizText>
                        </InfomationContainer>
 
                        <ButtonContainer>
                            <motion.div
                                key={questions[quizindex].index + "left"}
                                style={{ flex: 0, display: 'flex', justifyContent: 'left' }}
                                animate={{ x: moved==-1 ? -150 : 0}}   
                                exit={{opacity: 0 }} 
                                transition={{ duration: 0.5 }}
                            >
                            <QuizButton isblack={false} onClick={()=>{ClickedAns(true)}}>{questions[quizindex].options[0].label}</QuizButton>
                            </motion.div>
                            <motion.div 
                                key={questions[quizindex].index + 'right'} 
                                style={{ flex: 0, display: 'flex', justifyContent: 'right' }}
                                animate={{ x: moved==1 ? 150 : 0}}   
                                exit={{opacity: 0 }} 
                                transition={{ duration: 0.5 }}
                            >
                            <QuizButton isblack={true} onClick={()=>{ClickedAns(false)}}>{questions[quizindex].options[1].label}</QuizButton>
                            </motion.div>
                        </ButtonContainer>
                    </MainContainer>
                </motion.div>
            </AnimatePresence>
        </div>

        </>
    );
};
