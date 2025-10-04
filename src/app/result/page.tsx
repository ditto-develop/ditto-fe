"use client"

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react"
import styled, { keyframes } from "styled-components";

const dotAnimation = keyframes`
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: '....'; }
`;

const LoadingContainer = styled.div`
    height: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;

`;

const LoadingText = styled.p`
    font-size: 40px;
    font-weight: 800;
    line-height: 100%;
     &::after {
        content: '';
        animation: ${dotAnimation} 2s steps(1, end) infinite;
    }
`

export default function Result(){
    const [isloading, setIsloading] = useState<boolean>(true);

    useEffect(()=>{
        setTimeout(()=>{
            setIsloading(false);
        },5000); //임시로 5초뒤에 로딩창 해제되도록 셋팅
    },[])

    return(
        <>
            {isloading &&
                <LoadingContainer>
                    <LoadingText>Loading</LoadingText>
                </LoadingContainer>
            }
            <div>
                <Navbar share={true}/>
            </div>
        </>
    )
}