"use client"

import { Leftbutton, Rightbutton } from "@/components/Button";
import Navbar from "@/components/Navbar";
import WiggleText from "@/components/WiggleText";
import {MainContainer,InfomationContainer,ButtonContainer} from "@/components/quiz/Container";
import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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



export default function Quiz() {
    const router = useRouter();

    const [quizindex, setQuizindex] = useState(0);
    const [direction, setDirection] = useState<number>(1);
    const [disabled, setDisabled] = useState(false); //뒤로가기 연속터치 방지용

    const SetQuizData = (i: number) => {        
        const index = i-1;
        setQuizindex(index);
    }

    useEffect(()=>{
        SetQuizData(1);
    },[])

    const ClickedAns = (isLeft: boolean) => {
        const ansData = {
            quizNumber: dummyData[quizindex].quizNumber,
            answer: isLeft? 0 : 1
        };
        if(quizindex === 11) {
            router.push('/result');
            
            return;
        }

        setDirection(isLeft ? 1 : -1);
        SetQuizData(dummyData[quizindex].quizNumber+1);
    }

    const PrevQuiz = () => {
        if (disabled) return;
        if (quizindex === 0){
            router.back();
            return;
        } 
        setDisabled(true);
        setQuizindex((prev) => prev - 1);
        setTimeout(() => setDisabled(false), 700);     
    }


    return (
        <>
        <Navbar Prev={PrevQuiz}/>
            <div style={{overflow: "hidden", width:"100%"}}>
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={dummyData[quizindex].quizNumber} // 클릭할 때마다 새 key
                    custom={direction}
                    initial={{ x: direction * 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ y: 300, opacity: 0 }} 
                    transition={{ duration: 0.4 }}
                >
                    <MainContainer>
                        <InfomationContainer>
                            <p style={{textAlign: "center", fontWeight: "500", fontSize: "18px"}}>
                                {dummyData[quizindex].quizNumber}/{dummyData[quizindex].quizTotal}
                            </p>
                            <WiggleText>{dummyData[quizindex].quiz}</WiggleText>
                        </InfomationContainer>

                        <ButtonContainer>
                            <Leftbutton onClick={()=>{ClickedAns(true)}}>{dummyData[quizindex].leftAns}</Leftbutton>
                            <Rightbutton onClick={()=>{ClickedAns(false)}}>{dummyData[quizindex].rightAns}</Rightbutton>
                        </ButtonContainer>
                    </MainContainer>
                </motion.div>
            </AnimatePresence>
        </div>

        </>
    );
}
