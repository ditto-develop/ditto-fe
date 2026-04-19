import type { Meta } from "@storybook/react";
import {
  Body1Normal,
  Body1Reading,
  Body2Normal,
  Body2Reading,
  Caption1,
  Caption2,
  Display1,
  Display2,
  Heading1,
  Heading2,
  Headline1,
  Headline2,
  Label1Normal,
  Label1Reading,
  Label2,
  Title1,
  Title2,
  Title3,
} from "@/shared/ui";

type TypographySample = {
  name: string;
  size: string;
  lineHeight: string;
  letterSpacing: string;
  Component: typeof Display1;
};

const samples: TypographySample[] = [
  { name: "Display 1", size: "56px", lineHeight: "72px", letterSpacing: "-0.0319em", Component: Display1 },
  { name: "Display 2", size: "40px", lineHeight: "52px", letterSpacing: "-0.0282em", Component: Display2 },
  { name: "Title 1", size: "36px", lineHeight: "48px", letterSpacing: "-0.027em", Component: Title1 },
  { name: "Title 2", size: "28px", lineHeight: "38px", letterSpacing: "-0.0236em", Component: Title2 },
  { name: "Title 3", size: "24px", lineHeight: "32px", letterSpacing: "-0.023em", Component: Title3 },
  { name: "Heading 1", size: "22px", lineHeight: "30px", letterSpacing: "-0.0194em", Component: Heading1 },
  { name: "Heading 2", size: "20px", lineHeight: "28px", letterSpacing: "-0.012em", Component: Heading2 },
  { name: "Headline 1", size: "18px", lineHeight: "26px", letterSpacing: "-0.002em", Component: Headline1 },
  { name: "Headline 2", size: "17px", lineHeight: "24px", letterSpacing: "0em", Component: Headline2 },
  { name: "Body 1/Normal", size: "16px", lineHeight: "24px", letterSpacing: "0.0057em", Component: Body1Normal },
  { name: "Body 1/Reading", size: "16px", lineHeight: "26px", letterSpacing: "0.0057em", Component: Body1Reading },
  { name: "Body 2/Normal", size: "15px", lineHeight: "22px", letterSpacing: "0.0096em", Component: Body2Normal },
  { name: "Body 2/Reading", size: "15px", lineHeight: "24px", letterSpacing: "0.0096em", Component: Body2Reading },
  { name: "Label 1/Normal", size: "14px", lineHeight: "20px", letterSpacing: "0.0145em", Component: Label1Normal },
  { name: "Label 1/Reading", size: "14px", lineHeight: "22px", letterSpacing: "0.0145em", Component: Label1Reading },
  { name: "Label 2", size: "13px", lineHeight: "18px", letterSpacing: "0.0194em", Component: Label2 },
  { name: "Caption 1", size: "12px", lineHeight: "16px", letterSpacing: "0.0252em", Component: Caption1 },
  { name: "Caption 2", size: "11px", lineHeight: "14px", letterSpacing: "0.0311em", Component: Caption2 },
];

const meta: Meta = {
  title: "Design Tokens/Typography",
};

export default meta;

export const AllTypography = () => (
  <div
    style={{
      display: "grid",
      gap: 16,
      padding: 24,
      color: "var(--color-semantic-label-normal)",
      background: "var(--color-semantic-background-normal-normal)",
    }}
  >
    {samples.map(({ name, size, lineHeight, letterSpacing, Component }) => (
      <div
        key={name}
        style={{
          display: "grid",
          gridTemplateColumns: "180px 96px 96px 120px minmax(220px, 1fr)",
          gap: 16,
          alignItems: "start",
          borderBottom: "1px solid var(--color-semantic-line-normal-normal)",
          paddingBottom: 16,
        }}
      >
        <Label1Normal>{name}</Label1Normal>
        <Label2 $color="var(--color-semantic-label-alternative)">{size}</Label2>
        <Label2 $color="var(--color-semantic-label-alternative)">{lineHeight}</Label2>
        <Label2 $color="var(--color-semantic-label-alternative)">{letterSpacing}</Label2>
        <Component>역시 lorem 마찬가지로</Component>
      </div>
    ))}
  </div>
);
