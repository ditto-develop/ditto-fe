import styled from "styled-components";

/* ------------------------------------------------------
 *  Weight 설정 (light / regular / medium / semibold / bold)
 * ------------------------------------------------------ */
type FontWeight = "light" | "regular" | "medium" | "semibold" | "bold";

const weightMap: Record<FontWeight, number> = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/* ------------------------------------------------------
 *  BaseText: 모든 Typography의 공통 기반
 * ------------------------------------------------------ */
type BaseTextProps = {
  $color?: string;
  $align?: "left" | "center" | "right" | "justify";
  $weight?: FontWeight;
};

export const BaseText = styled.p<BaseTextProps>`
  font-family: "Pretendard JP";
  font-style: normal;
  margin: 0;
  padding: 0;

  /* 기본 색 → override 가능 */
  color: ${({ $color }) =>
    $color ?? "var(--Semantic-Label-Normal, #1A1815)"};

  /* override 가능한 정렬 */
  text-align: ${({ $align }) => $align ?? "inherit"};

  /* override 가능한 weight */
  font-weight: ${({ $weight }) =>
    $weight ? weightMap[$weight] : "inherit"};
`;

/* ------------------------------------------------------
 *  DISPLAY
 * ------------------------------------------------------ */

export const Display1 = styled(BaseText)`
  font-size: 56px;
  line-height: 1.286;
  letter-spacing: -0.0319em;
  font-weight: 700;
`;

export const Display2 = styled(BaseText)`
  font-size: 40px;
  line-height: 1.3;
  letter-spacing: -0.0282em;
  font-weight: 700;
`;

/* ------------------------------------------------------
 *  TITLE
 * ------------------------------------------------------ */

export const Title1 = styled(BaseText)`
  font-size: 36px;
  line-height: 1.334;
  letter-spacing: -0.027em;
  font-weight: 700;
`;

export const Title2 = styled(BaseText)`
  font-size: 28px;
  line-height: 1.358;
  letter-spacing: -0.0236em;
  font-weight: 700;
`;

export const Title3 = styled(BaseText)`
  font-size: 24px;
  line-height: 1.334;
  letter-spacing: -0.023em;
  font-weight: 700;
`;

/* ------------------------------------------------------
 *  HEADING
 * ------------------------------------------------------ */

export const Heading1 = styled(BaseText)`
  font-size: 22px;
  line-height: 1.364;
  letter-spacing: -0.0194em;
  font-weight: 600;
`;

export const Heading2 = styled(BaseText)`
  font-size: 20px;
  line-height: 1.4;
  letter-spacing: -0.012em;
  font-weight: 600;
`;

/* ------------------------------------------------------
 *  HEADLINE
 * ------------------------------------------------------ */

export const Headline1 = styled(BaseText)`
  font-size: 18px;
  line-height: 1.445;
  letter-spacing: -0.002em;
  font-weight: 600;
`;

export const Headline2 = styled(BaseText)`
  font-size: 17px;
  line-height: 1.412;
  letter-spacing: 0;
  font-weight: 600;
`;

/* ------------------------------------------------------
 *  BODY
 * ------------------------------------------------------ */

export const Body1Normal = styled(BaseText)`
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.0057em;
  font-weight: 400;
`;

export const Body1Reading = styled(BaseText)`
  font-size: 16px;
  line-height: 1.625;
  letter-spacing: 0.0057em;
  font-weight: 400;
`;

export const Body2Normal = styled(BaseText)`
  font-size: 15px;
  line-height: 1.467;
  letter-spacing: 0.0096em;
  font-weight: 400;
`;

export const Body2Reading = styled(BaseText)`
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: 0.0096em;
  font-weight: 400;
`;

/* ------------------------------------------------------
 *  LABEL
 * ------------------------------------------------------ */

export const Label1Normal = styled(BaseText)`
  display: flex;
  align-items: center;

  font-size: 14px;
  line-height: 1.429;
  letter-spacing: 0.0145em;
  font-weight: 500;
`;

export const Label1Reading = styled(BaseText)`
  font-size: 14px;
  line-height: 1.571;
  letter-spacing: 0.0145em;
  font-weight: 500;
`;

export const Label2 = styled(BaseText)`
  font-size: 13px;
  line-height: 1.385;
  letter-spacing: 0.0194em;
  font-weight: 500;
`;

/* ------------------------------------------------------
 *  CAPTION
 * ------------------------------------------------------ */

export const Caption1 = styled(BaseText)`
  font-size: 12px;
  line-height: 1.334;
  letter-spacing: 0.0252em;
  font-weight: 400;
`;

export const Caption2 = styled(BaseText)`
  font-size: 11px;
  line-height: 1.273;
  letter-spacing: 0.0311em;
  font-weight: 400;
`;

/* ------------------------------------------------------
 *  INLINE 강조용 span
 * ------------------------------------------------------ */

export const UnderlineBoldSpan = styled.span`
  font-weight: 700;
  text-decoration-line: underline;
`;
