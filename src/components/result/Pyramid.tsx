import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative; /* 자식 요소 위치의 기준점이 됩니다. */
  display: inline-block; /* 이미지 크기에 맞게 컨테이너 크기 조절 */
`;

const BgImg = styled.img`

`;

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

const PyramidA = () => {
  return (
    <Wrapper>
      <BgImg 
        src='/Tier/Tier.svg'
      />
      <TextArea>
        <Text color='black'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </Wrapper>
  );
};

const PyramidB = () => {
  return (
    <>
      <BgImg 
        src='/Tier/Tier2.svg'
      />
      <TextArea>
        <Text color='#C93D2E'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </>
  );
};

const PyramidC = () => {
  return (
    <>
      <BgImg 
        src='/Tier/Tier3.svg'
      />
      <TextArea>
        <Text color='#C93D2E'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </>
  );
};

const PyramidD = () => {
  return (
    <>
      <BgImg 
        src='/Tier/Tier4.svg'
      />
      <TextArea>
        <Text color='#C93D2E'>Super Rare</Text>
        <Text color='white'>Rare</Text>
        <Text color='white'>Medium Rare</Text>
        <Text color='white'>Welldone</Text>
      </TextArea>
    </>
  );
};

type PyramidType = {
  type: string
};

const Pyramid = ({type}:PyramidType) => {
  switch(type){
    case "superrare" : 
      return (
        <PyramidA />
      );
    case "rare" : 
      return(
        <PyramidB />
      );
    case "mediumrare" : 
      return(
        <PyramidC />
      );
    case "welldone" : 
      return(
        <PyramidD />
      );
    default :
      return (
        <></>
      )
  }
}

export default Pyramid;