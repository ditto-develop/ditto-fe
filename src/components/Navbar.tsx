/** 
 * Navigation Bar 에 사용되는 컴포넌트 (Global)
 * <Navbar />
 * **Props**
 * - Prev? : 뒤로가기 버튼에 대한 함수
 * - header? : Nav Header 텍스트
 * - share? : 공유하기 버튼에 대한 함수(추후개발) 
*/

"use client"

import Image from "next/image";
import { HTMLAttributes } from "react";
import styled from "styled-components";

const Nav = styled.div`
    position: fixed;
    padding: 16px 16px;
    display: flex;
    justify-content: space-between;
    top: 0;                  
    left: 50%;                       
    transform: translateX(-50%);     
    width: 100%;   
    max-width: 640px;           
    background-color: #F3F1EF;  
    z-index: 996;            
`;

const Leftbox = styled.div`
    display: flex;
    gap: 20px;
    align-items: center;
`

type NavbarType = HTMLAttributes<HTMLDivElement> & {
    Prev?: () => void,
    header?: string,
    share?: boolean
    shareHandle? : () => void
}


export default function Navbar({Prev,header,share,shareHandle}:NavbarType) {
    return(
        <>
            <Nav>
                <Leftbox>
                    <Image 
                        draggable="false" 
                        onClick={Prev}
                        src='/prev.svg'
                        style={{cursor: 'pointer'}}
                        alt="뒤로가기"
                        width={7.5*1.5}
                        height={15}
                    />
                    <span style={{fontSize: "24px", fontWeight: "bold"}}>{header}</span>
                </Leftbox>
                {share && <Image 
                            draggable="false" 
                            onClick={shareHandle}
                            src='/share.svg'
                            style={{cursor: 'pointer'}}
                            alt="공유하기"
                            width={20}
                            height={20}
                />}
            </Nav>
        </>
    )
}