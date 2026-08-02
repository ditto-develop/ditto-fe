import styled from "styled-components";

interface GroupStepIndicatorProps {
  current: number;
  total: number;
}

export function GroupStepIndicator({ current, total }: GroupStepIndicatorProps) {
  return <Indicator aria-label={`${total}명 중 ${current}번째 멤버`}>{current}/{total}</Indicator>;
}

const Indicator = styled.p`
  margin: 0;
  text-align: center;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
