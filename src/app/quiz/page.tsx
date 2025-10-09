"use client"

import { Leftbutton, Rightbutton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import WiggleText from "@/components/WiggleText";
import {MainContainer,InfomationContainer,ButtonContainer} from "@/components/quiz/Container";
import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GameService } from "@/api";

const dummyData = [
  {    
    id: "q1",
    round: 1,
    text: "정원에 나무를 심는다면?",
    options: [
      { index: "0", label: "올리브 나무" },
      { index: "1", label: "사과 나무" },
    ],
  },
  {    
    id: "q2",
    round: 2,
    text: "마지막으로 먹는 아이스크림은?",
    options: [
      { index: "0", label: "바밤바" },
      { index: "1", label: "탱크보이" },
    ],
  },
  {    
    id: "q3",
    round: 3,
    text: "한국을 대표하는 축구선수는?",
    options: [
      { index: "0", label: "박지성" },
      { index: "1", label: "손흥민" },
    ],
  },
  {    
    id: "q4",
    round: 4,
    text: "한 가지 능력을 갖는다면?",
    options: [
      { index: "0", label: "순간이동" },
      { index: "1", label: "투명인간" },
    ],
  },
  {    
    id: "q5",
    round: 5,
    text: "바다에서 소통할 수 있다면?",
    options: [
      { index: "0", label: "거북이" },
      { index: "1", label: "문어" },
    ],
  },
  {    
    id: "q6",
    round: 6,
    text: "평생 한가지만 탄다면?",
    options: [
      { index: "0", label: "지하철" },
      { index: "1", label: "버스" },
    ],
  },
  {    
    id: "q7",
    round: 7,
    text: "편지를 보내면 누구한테?",
    options: [
      { index: "0", label: "과거의 나" },
      { index: "1", label: "미래의 나" },
    ],
  },
  {    
    id: "q8",
    round: 8,
    text: "하나의 감각만 남긴다면?",
    options: [
      { index: "0", label: "말하기" },
      { index: "1", label: "보기" },
    ],
  },
  {    
    id: "q9",
    round: 9,
    text: "날씨가 하나라면?",
    options: [
      { index: "0", label: "흐리지만 시원" },
      { index: "1", label: "맑지만 더움" },
    ],
  },
  {    
    id: "q10",
    round: 10,
    text: "커튼을 열었는데 보이는 건?",
    options: [
      { index: "0", label: "일몰의 주황색" },
      { index: "1", label: "깊은 바다의 파란색" },
    ],
  },
  {    
    id: "q11",
    round: 11,
    text: "평생 하나만 한다면?",
    options: [
      { index: "0", label: "유튜브" },
      { index: "1", label: "인스타그램" },
    ],
  },
  {    
    id: "q12",
    round: 12,
    text: "내일부터 악기를 배운다면?",
    options: [
      { index: "0", label: "우클렐레" },
      { index: "1", label: "드럼" },
    ],
  },
];


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
    const [isClient, setIsClient] = useState(false); // ✅ 클라이언트 렌더링 플래그
    const [isLoading, setIsLoading] = useState(true);


    /** Effect Section */
    useEffect(()=>{ //첫 화면 Init시 작동
        setIsClient(true);
        /* API 호출용. 추후 오픈 예정.
        GameService.gameControllerGetQuestions("1")
            .then((res) => {
                const result = res as SuccessApiResponseWithData;
                setQuestions(result.data);
                setIsLoading(false);
            })
        */

        setQuestions(dummyData); //임시사용코드
        setIsLoading(false); //임시사용코드
        
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

        if(quizindex === 11) {
            router.push('/result');
            return;
        };

        setDirection(isLeft ? 1 : -1);
        SetQuizData(questions[quizindex].round+1);
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
