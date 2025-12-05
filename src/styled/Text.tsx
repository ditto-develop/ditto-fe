import styled from 'styled-components';

const BaseText = styled.p`
  text-align: center;
  font-family: "Pretendard JP";
  font-style: normal;
`;

// Body 1 / Medium
export const SubAlterText = styled(BaseText)`
  color: var(--Semantic-Label-Alternative, var(--Label-Alternative, rgba(47, 43, 39, 0.61)));
  font-feature-settings: 'ss10' on;

  font-size: 16px;
  font-weight: 500;
  line-height: 150%; /* 24px */
  letter-spacing: 0.091px;
`;

// Headline 1 / Bold
export const SubNormalText = styled(BaseText)`
  color: var(--Semantic-Label-Normal, var(--Label-Normal, #1A1815));

  font-size: 18px;
  font-weight: 600;
  line-height: 144.5%; /* 26.01px */
  letter-spacing: -0.004px;
`;

// Body 1 / Neutral - Medium
export const SubNeutralText = styled(BaseText)`
  color: var(--Semantic-Label-Neutral, var(--Label-Neutral, rgba(47, 43, 39, 0.88)));
  font-feature-settings: 'ss10' on;

  font-size: 16px;
  font-weight: 500;
  line-height: 150%; /* 24px */
  letter-spacing: 0.091px;
`;

