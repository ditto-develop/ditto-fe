import styled from "styled-components";

export type FontWeight = "light" | "regular" | "medium" | "semibold" | "bold";

const weightMap: Record<FontWeight, number> = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

type BaseTextProps = {
  $color?: string;
  $align?: "left" | "center" | "right" | "justify";
  $weight?: FontWeight;
};

const getWeight = (weight: FontWeight | undefined, fallback: FontWeight) =>
  weightMap[weight ?? fallback];

export const BaseText = styled.p<BaseTextProps>`
  margin: 0;
  padding: 0;
  color: ${({ $color }) => $color ?? "var(--color-semantic-label-normal)"};
  font-family: var(--font-pretendard-jp), "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
  font-style: normal;
  text-align: ${({ $align }) => $align ?? "inherit"};
`;

export const Display1 = styled(BaseText)`
  font-size: var(--typography-display-1-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "bold")};
  line-height: var(--typography-display-1-line-height);
  letter-spacing: var(--typography-display-1-letter-spacing);
`;

export const Display2 = styled(BaseText)`
  font-size: var(--typography-display-2-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "bold")};
  line-height: var(--typography-display-2-line-height);
  letter-spacing: var(--typography-display-2-letter-spacing);
`;

export const Title1 = styled(BaseText)`
  font-size: var(--typography-title-1-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "bold")};
  line-height: var(--typography-title-1-line-height);
  letter-spacing: var(--typography-title-1-letter-spacing);
`;

export const Title2 = styled(BaseText)`
  font-size: var(--typography-title-2-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "bold")};
  line-height: var(--typography-title-2-line-height);
  letter-spacing: var(--typography-title-2-letter-spacing);
`;

export const Title3 = styled(BaseText)`
  font-size: var(--typography-title-3-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "bold")};
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
`;

export const Heading1 = styled(BaseText)`
  font-size: var(--typography-heading-1-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
`;

export const Heading1Bold = Heading1;

export const Heading2 = styled(BaseText)`
  font-size: var(--typography-heading-2-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
  line-height: var(--typography-heading-2-line-height);
  letter-spacing: var(--typography-heading-2-letter-spacing);
`;

export const Heading2Bold = Heading2;

export const Headline1 = styled(BaseText)`
  font-size: var(--typography-headline-1-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
  line-height: var(--typography-headline-1-line-height);
  letter-spacing: var(--typography-headline-1-letter-spacing);
`;

export const Headline2 = styled(BaseText)`
  font-size: var(--typography-headline-2-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
`;

export const Body1Normal = styled(BaseText)`
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
`;

export const Body1Bold = styled(Body1Normal)`
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
`;

export const Body1Reading = styled(BaseText)`
  font-size: var(--typography-body-1-reading-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-body-1-reading-line-height);
  letter-spacing: var(--typography-body-1-reading-letter-spacing);
`;

export const Body2Normal = styled(BaseText)`
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
`;

export const Body2Reading = styled(BaseText)`
  font-size: var(--typography-body-2-reading-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-body-2-reading-line-height);
  letter-spacing: var(--typography-body-2-reading-letter-spacing);
`;

export const Label1Normal = styled(BaseText)`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
`;

export const Label1Reading = styled(BaseText)`
  font-size: var(--typography-label-1-reading-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "semibold")};
  line-height: var(--typography-label-1-reading-line-height);
  letter-spacing: var(--typography-label-1-reading-letter-spacing);
`;

export const Label2 = styled(BaseText)`
  font-size: var(--typography-label-2-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
`;

export const Caption1 = styled(BaseText)`
  font-size: var(--typography-caption-1-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
`;

export const Caption2 = styled(BaseText)`
  font-size: var(--typography-caption-2-font-size);
  font-weight: ${({ $weight }) => getWeight($weight, "regular")};
  line-height: var(--typography-caption-2-line-height);
  letter-spacing: var(--typography-caption-2-letter-spacing);
`;

export const UnderlineBoldSpan = styled.span`
  font-weight: ${weightMap.bold};
  text-decoration-line: underline;
`;
