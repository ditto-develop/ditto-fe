"use client"

import { Leftbutton, Rightbutton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import WiggleText from "@/components/WiggleText";
import {MainContainer,InfomationContainer,ButtonContainer} from "@/components/quiz/Container";
import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GameService } from "@/api";

const dummyData = 
    [
        {    
            quizTotal: 12,
            quizNumber : 1,
            quiz: "정원에 나무를 심는다면?",
            leftAns: "올리브 나무",
            rightAns: "사과 나무"
        },
        {    
            quizTotal: 12,
            quizNumber : 2,
            quiz: "마지막으로 먹는 아이스크림은?",
            leftAns: "바밤바",
            rightAns: "탱크보이"
        },  
        {    
            quizTotal: 12,
            quizNumber : 3,
            quiz: "한국을 대표하는 축구선수는?",
            leftAns: "박지성",
            rightAns: "손흥민"
        },  
        {    
            quizTotal: 12,
            quizNumber : 4,
            quiz: "한 가지 능력을 갖는다면?",
            leftAns: "순간이동",
            rightAns: "투명인간"
        },  
        {    
            quizTotal: 12,
            quizNumber : 5,
            quiz: "바다에서 소통할 수 있다면?",
            leftAns: "거북이",
            rightAns: "문어"
        },  
        {    
            quizTotal: 12,
            quizNumber : 6,
            quiz: "평생 한가지만 탄다면?",
            leftAns: "지하철",
            rightAns: "버스"
        },  
        {    
            quizTotal: 12,
            quizNumber : 7,
            quiz: "편지를 보내면 누구한테?",
            leftAns: "과거의 나",
            rightAns: "미래의 나"
        },  
        {    
            quizTotal: 12,
            quizNumber : 8,
            quiz: "하나의 감각만 남긴다면?",
            leftAns: "말하기",
            rightAns: "보기"
        },  
        {    
            quizTotal: 12,
            quizNumber : 9,
            quiz: "날씨가 하나라면?",
            leftAns: "흐리지만 시원",
            rightAns: "맑지만 더움"
        },  
        {    
            quizTotal: 12,
            quizNumber : 10,
            quiz: "커튼을 열었는데 보이는 건?",
            leftAns: "일몰의 주황색",
            rightAns: "깊은 바다의 파란색"
        },  
        {    
            quizTotal: 12,
            quizNumber : 11,
            quiz: "평생 하나만 한다면?",
            leftAns: "유튜브",
            rightAns: "인스타그램"
        },  
        {    
            quizTotal: 12,
            quizNumber : 12,
            quiz: "내일부터 악기를 배운다면?",
            leftAns: "우클렐레",
            rightAns: "드럼"
        }
]

type Question = {
  id: string;
  round: number;
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
    const [isLoading, setIsLoading] = useState(true);


    /** Effect Section */
    useEffect(()=>{ //첫 화면 Init시 작동
        GameService.gameControllerGetQuestions("1")
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
            round: String(quizindex),
            questionId: questions[quizindex].id,
            requestBody: {
                selectedIndex: isLeft? 0 : 1
            }
        };
        GameService.gameControllerSubmitAnswers(ansData.round,ansData.questionId,ansData.requestBody)
            .then((res)=>{
                console.log(res);
            })
            .catch((err)=>{
                console.error(err);
            })

        if(quizindex === 0) {
            router.push('/result');
            return;
        };

        setDirection(isLeft ? 1 : -1);
        SetQuizData(dummyData[quizindex].quizNumber+1);
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
    if (isLoading) return <div></div>; //첫 정보 로딩시 작동


    return (
        <>
        <Navbar Prev={PrevQuiz}/>
            <div style={{overflow: "hidden", width:"100%"}}>
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={questions[quizindex].round} // 클릭할 때마다 새 key
                    custom={direction}
                    initial={{ x: direction * 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ y: 300, opacity: 0 }} 
                    transition={{ duration: 0.4 }}
                >
                    <MainContainer>
                        <InfomationContainer>
                            <p style={{textAlign: "center", fontWeight: "500", fontSize: "18px"}}>
                                {questions[quizindex].round}/{12}
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
