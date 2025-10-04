// components/WobblyText.js
// 추후 삭제예정 


import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

// 자글거리는 효과를 적용할 텍스트를 감싸는 스타일 컴포넌트
const WobblyTextWrapper = styled.span`
  filter: url('#wobble-filter');

  font-size: clamp(1rem, 8vw, 2.5rem);
  font-weight: bold;
  color: black;
`;

/**
 * 자글거리는 텍스트 효과를 위한 재사용 가능 컴포넌트
 * @param {object} props
 * @param {React.ReactNode} props.children - 내부에 표시될 텍스트 또는 다른 요소
 * @param {number} [props.frequency=0.02] - 자글거림의 빈도 (Frequency). 값이 클수록 더 촘촘해집니다.
 * @param {number} [props.wiggle=5] - 자글거림의 강도 (Wiggle). 값이 클수록 왜곡이 심해집니다.
 */

type wobblyTextType = HTMLAttributes<HTMLDivElement>&{
    frequency?: number,
    wiggle?: number
}

const WobblyText = ({ children, frequency = 0.4, wiggle = 2 }:wobblyTextType) => {
  const filterId = 'wobble-filter';

  return (
    <>
      {/* 이 SVG는 화면에 직접 보이지 않고 필터 정의 역할만 합니다.
        width="0" height="0"으로 렌더링 공간을 차지하지 않게 합니다.
      */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId}>
            {/* feTurbulence: 노이즈(Perlin noise)를 생성합니다.
              - baseFrequency: 'Frequency'와 직접적인 연관이 있습니다.
              - numOctaves: 노이즈의 디테일을 결정합니다.
            */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={frequency}
              numOctaves="3"
              result="turbulence"
            />
            {/*
              feDisplacementMap: feTurbulence로 만든 노이즈를 이용해 원본 그래픽(텍스트)을 변형시킵니다.
              - in: 원본 소스 (SourceGraphic은 이 필터가 적용된 요소를 의미)
              - in2: 변형에 사용할 맵 (위에서 result="turbulence"로 지정한 결과)
              - scale: 'Wiggle' 강도와 직접적인 연관이 있습니다.
            */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={wiggle}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <WobblyTextWrapper>{children}</WobblyTextWrapper>
    </>
  );
};

export default WobblyText;