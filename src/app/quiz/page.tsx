"use client"

import { Leftbutton, Rightbutton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import WiggleText from "@/components/WiggleText";
import {MainContainer,InfomationContainer,ButtonContainer} from "@/components/quiz/Container";
import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GameService, OpenAPI } from "@/api";

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
    const router = useRouter();

    /** State Section */
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizindex, setQuizindex] = useState<number>(0);
    const [direction, setDirection] = useState<number>(1);
    const [disabled, setDisabled] = useState(false); //뒤로가기 연속터치 방지용
    const [isClient, setIsClient] = useState(false); // ✅ 클라이언트 렌더링 플래그
    const [isLoading, setIsLoading] = useState(true);


    /** Effect Section */
    useEffect(()=>{ //첫 화면 Init시 작동
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
        if(quizindex === 11) {
            router.push('/result');
            return;
        };
        
        const ansData = {
            round: 1, //임시지정 (라운드가 변화할 시 변수로 사용 예정)
            questionId: questions[quizindex].id,
            requestBody: {
                selectedIndex: 0
            }
        }

        GameService.gameControllerSubmitAnswers( //답변제출 API
          ansData.round,
          ansData.questionId,
          ansData.requestBody)
            .then((res)=>{
                setDirection(isLeft ? 1 : -1);
                SetQuizData(questions[quizindex].index+1);
            })
            .catch((err)=>{
                console.error("에러발생",err);
          });
        

        

    }

    const PrevQuiz = () => { //이전 퀴즈로 돌아가는 함수
        if (disabled) return;
        if (quizindex === 0){
            router.back();
            return;
        } 
        setDisabled(true);
        setQuizindex((prev) => prev - 1);
        setTimeout(() => setDisabled(false), 700);     
    }
    
    
    /** Return Section */
    if (!isClient || isLoading) return <div />; // ✅ 서버와 클라이언트의 초기 HTML을 일치시킴


    return (
        <>
        <Navbar Prev={PrevQuiz}/>
            <div style={{overflow: "hidden", width:"100%"}}>
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={questions[quizindex].index} // 클릭할 때마다 새 key
                    custom={direction}
                    initial={{ x: direction * 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ y: 300, opacity: 0 }} 
                    transition={{ duration: 0.4 }}
                >
                    <MainContainer>
                        <InfomationContainer>
                            <p style={{textAlign: "center", fontWeight: "500", fontSize: "18px"}}>
                                {questions[quizindex].index}/{12}
                            </p>
                            <WiggleText>{questions[quizindex].text}</WiggleText>
                        </InfomationContainer>

                        <ButtonContainer>
                            <Leftbutton onClick={()=>{ClickedAns(true)}}>{questions[quizindex].options[0].label}</Leftbutton>
                            <Rightbutton onClick={()=>{ClickedAns(false)}}>{questions[quizindex].options[1].label}</Rightbutton>
                        </ButtonContainer>
                    </MainContainer>
                </motion.div>
            </AnimatePresence>
        </div>

        </>
    );
}
