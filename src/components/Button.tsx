"use client"

import { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { keyframes, styled } from "styled-components";

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
const fadeIn = keyframes`
  from {
    opacity: 0.4;
  }
  to {
    opacity: 1;
  }
`;

const Middlebox = styled.button`
    animation: ${fadeIn} 0.5s ease-in-out forwards;
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
    border-radius: 1px;
    background-color: black;
    z-index: 0;
  }
`;
const MiddleWhitebox = styled.div`
    display: flex;
    position: relative;
    width: 305px;
    height: 62.8px;
    align-items:center; 
    justify-content:center;
`;

const Imgbox = styled.img`
    position: absolute;
    z-index: 0;
    width: 100%;
`;

type divType = HTMLAttributes<HTMLDivElement>
type buttonType = ButtonHTMLAttributes<HTMLButtonElement>


export const Leftbutton = ({children, ...props}:divType) => {
    return(
        <>
            <Leftbox
                {...props}    
            >
                <Imgbox 
                    src='/buttons/button.svg'
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
                    src='/buttons/button.svg'
                />
                <Boxtext
                    style={{color: "white"}}
                >{children}</Boxtext>
            </Rightbox> 
        </>
    )
}

export const Blackbutton = ({children, ...props}:buttonType) => {
    return(
        <>
            <Middlebox
                {...props}    
            >
                <Imgbox 
                    src='/buttons/button.svg'
                />
                <Boxtext
                    style={{color: "white"}}
                >{children}</Boxtext>
            </Middlebox> 
        </>
    )
}

const Smallbox = styled.div`
    animation: ${fadeIn} 0.5s ease-in-out forwards;
    display: flex;
    position: relative;
    width: 281px;
    height: 52px;
    align-items:center; 
    justify-content:center;

    &::before {
    content: "";
    position: absolute;
    inset: 3px;   /* 👈 inset 값이 클수록 더 작아짐 */
    border-radius: 1px;
    background-color: black;
    z-index: 0;
  }
`;
export const MiddleBlackbutton = ({children, ...props}:divType) => {
    return(
        <>
            <Smallbox
                {...props}    
            >
                <Imgbox 
                    src='/buttons/button.svg'
                />
                <Boxtext
                    style={{color: "white"}}
                >{children}</Boxtext>
            </Smallbox> 
        </>
    )
}


type enableType = ButtonHTMLAttributes<HTMLButtonElement> &{
    enable: boolean
};
const MiddleGraybox = styled.div`
    display: flex;
    position: relative;
    width: 345px;
    height: 62.8px;
    align-items:center; 
    justify-content:center;

    &::before {
    content: "";
    position: absolute;
    inset: 3px;   
    border-radius: 1px;
    background-color: #9b9b9b;
    z-index: 0;
  }
`;
export const BlackEnablebutton = ({enable,children, ...props}:enableType) => {
    return(
        <>
            {enable?<><Blackbutton {...props}>{children}</Blackbutton></>:
            <MiddleGraybox>
                <Imgbox src='/buttons/graybutton.svg' />
                <Boxtext
                    style={{color: "white"}}
                >{children}</Boxtext>
            </MiddleGraybox> 
            }
        </>
    )
}

const ImgMiddlebox = styled.img`
    position: absolute;
    z-index: 0;
    width: 60%;
`;
export const Whitebutton = ({children, ...props}:divType) => {
    return(
        <>
            <MiddleWhitebox
                {...props}    
            >
                <ImgMiddlebox 
                    src='/buttons/MiddleButton.svg'
                />
                <Boxtext
                    style={{color: "black"}}
                >{children}</Boxtext>
            </MiddleWhitebox> 
        </>
    )
}