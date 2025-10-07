import styled, { keyframes } from "styled-components";

const dotAnimation = keyframes`
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: '....'; }
`;

const LoadingText = styled.p`
    font-family: 'IM Fell Double Pica';
    font-style: italic;
    font-size: 40px;
    font-weight: 600;
    line-height: 100%;
     &::after {
        content: '';
        font-family: 'IM Fell Double Pica';
        font-style: italic;
        font-size: 40px;
        font-weight: 600;
        animation: ${dotAnimation} 2s steps(1, end) infinite;
    }
`;

const SubtitleText = styled.p`
    text-align: center;
    font-weight: 500;
`;

const TitleText = styled.p`
    font-family: 'IM Fell Double Pica';
    text-align: center;
    font-style: italic;
    font-weight: 600;
    font-size: 48px;
    color: #C93D2E;
`;

const ShareText = styled.p`
    padding-top: 16px;
    text-align: center;
    color: #0000005c;
`;

const BottomTitle = styled.h1`
    font-weight: 700;
    font-weight: bold;
    font-size: 24px;
`

const BottomSubTitle = styled.p`
    font-size: 14px;
    font-weight: 500;
    color: #0000005c;
`

export {BottomSubTitle,BottomTitle, LoadingText,SubtitleText,TitleText,ShareText};