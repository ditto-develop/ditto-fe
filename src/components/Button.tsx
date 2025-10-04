"use client"

import Image from "next/image";
import { HTMLAttributes } from "react";
import { styled } from "styled-components";


const Leftbox = styled.div`
    justify-self: left;
    display: flex;
    position: relative;
    width: 305px;
    align-items:center; 
    justify-content:center;
`;

const Boxtext = styled.span`
    text-align: center;
    z-index: 1;
`;


const Rightbox = styled.div`
    justify-self: right;
    display: flex;
    position: relative;
    width: 305px;
    height: 56.1px;
    align-items:center; 
    justify-content:center;

    &::before {
    content: "";
    position: absolute;
    inset: 3px;   /* 👈 inset 값이 클수록 더 작아짐 */
    background: black;
    border-radius: 1px;
    z-index: 0;
  }
`;

const Middlebox = styled.div`
    display: flex;
    position: relative;
    width: 345px;
    height: 62.8px;
    align-items:center; 
    justify-content:center;

    &::before {
    content: "";
    position: absolute;
    inset: 3px;   /* 👈 inset 값이 클수록 더 작아짐 */
    background: black;
    border-radius: 1px;
    z-index: 0;
  }
`;

const Imgbox = styled.img`
    position: absolute;
    z-index: 0;
    width: 100%;
`;

type divType = HTMLAttributes<HTMLDivElement>

export const Leftbutton = ({children, ...props}:divType) => {
    return(
        <>
            <Leftbox
                {...props}    
            >
                <Imgbox 
                    src='/button.svg'
                />
                <Boxtext>{children}</Boxtext>
            </Leftbox>
        </>
    )
}

export const Rightbutton = ({children, ...props}:divType) => {
    return(
        <>
            <Rightbox
                {...props}    
            >
                <Imgbox 
                    src='/button.svg'
                />
                <Boxtext
                    style={{color: "white"}}
                >{children}</Boxtext>
            </Rightbox> 
        </>
    )
}

export const Blackbutton = ({children, ...props}:divType) => {
    return(
        <>
            <Middlebox
                {...props}    
            >
                <Imgbox 
                    src='/button.svg'
                />
                <Boxtext
                    style={{color: "white"}}
                >{children}</Boxtext>
            </Middlebox> 
        </>
    )
}