import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative; /* 자식 요소 위치의 기준점이 됩니다. */
  display: inline-block; /* 이미지 크기에 맞게 컨테이너 크기 조절 */
`;

const BgImg = styled.img.attrs({ crossOrigin: 'anonymous' })``;
const InfoImg = styled.img``;

const TextArea = styled.div`
  position: absolute; 
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center; 
  align-items: center;   

  gap: 40px;
`;

interface textProps {
  color : string
}
const Text = styled.p<textProps>`
  font-family: 'IM FELL Double Pica';
  color: ${({color})=>color};

  font-size: 24px;
  font-weight: bold;
  text-align: center;
  font-style: italic;
`;

interface infoAreaProps {
  top: number;
  left: number;
};

const InfoArea = styled.div<infoAreaProps>`
  position: absolute; 
  top: ${({top})=>top}%;
  left: ${({left})=>left}%;
  width: 119.628px;
  height: 75.502px;

  background-repeat: no-repeat;
  padding: 18px 16px;

  background-image: url('/PyramidInfo.svg'); 
  display: grid;
`;

const InfoText = styled.p`
  color: white;
  text-align: center;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -0.27px;
  z-index: 99;
`;

type InfoType = {
  total: number,
  number :number
}
const PyramidA = ({total,number}:InfoType) => {
  return (
    <Wrapper>
      <BgImg 
        src='/Tier/Tier.svg'
      />
      <InfoArea
        top={-5}
        left={66}
      >
        <InfoText style={{fontSize: "12px"}}>전체 {total.toLocaleString()}명 중</InfoText>
        <InfoText>{number}명 {(number/total*100).toFixed(2)}%</InfoText>
      </InfoArea>
      <TextArea>
        <Text color='black'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </Wrapper>
  );
};

const PyramidB = ({total,number}:InfoType) => {
  return (
    <Wrapper>
      <BgImg 
        src='/Tier/Tier2.svg'
      />
      <InfoArea
        top={18}
        left={65}
      >
        <InfoText style={{fontSize: "12px"}}>전체 {total.toLocaleString()}명 중</InfoText>
        <InfoText>{number}명 {(number/total*100).toFixed(2)}%</InfoText>
      </InfoArea>
      <TextArea>
        <Text color='#C93D2E'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </Wrapper>
  );
};

const PyramidC = ({total,number}:InfoType) => {
  return (
    <Wrapper>
      <BgImg 
        src='/Tier/Tier3.svg'
      />
      <InfoArea
        top={33}
        left={70}
      >
        <InfoText style={{fontSize: "12px"}}>전체 {total.toLocaleString()}명 중</InfoText>
        <InfoText>{number}명 {(number/total*100).toFixed(2)}%</InfoText>
      </InfoArea>
      <TextArea>
        <Text color='#C93D2E'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </Wrapper>
  );
};

const PyramidD = ({total,number}:InfoType) => {
  return (
    <Wrapper>
      <BgImg 
        src='/Tier/Tier4.svg'
      />
      <InfoArea
        top={60}
        left={84}
      >
        <InfoText style={{fontSize: "12px"}}>전체 {total.toLocaleString()}명 중</InfoText>
        <InfoText>{number}명 {(number/total*100).toFixed(2)}%</InfoText>
      </InfoArea>
      <TextArea>
        <Text color='#C93D2E'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </Wrapper>
  );
};

type PyramidType = {
  type: string,
  total: number,
  number: number
};

const Pyramid = ({type,total,number}:PyramidType) => {
  switch(type){
    case "Super Rare" : 
      return (
        <PyramidA total={total} number={number}/>
      );
    case "Rare" : 
      return(
        <PyramidB total={total} number={number}/>
      );
    case "Medium Rare" : 
      return(
        <PyramidC total={total} number={number}/>
      );
    case "Well-Done" : 
      return(
        <PyramidD total={total} number={number}/>
      );
    default :
      return (
        <></>
      )
  }
}

export default Pyramid;