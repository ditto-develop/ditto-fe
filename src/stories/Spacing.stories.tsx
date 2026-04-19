import type { Meta } from "@storybook/react";
import { Body1Normal, Label1Normal, Label2 } from "@/shared/ui";
import { space, type SpaceKey } from "@/shared/styles/tokens";

const orderedSpaceKeys: SpaceKey[] = [
  "0",
  "1px",
  "2px",
  "1",
  "6px",
  "2",
  "10px",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "18",
  "20",
  "24",
  "28",
  "30",
  "32",
  "36",
  "40",
  "48",
  "52",
  "56",
  "64",
  "72",
  "80",
  "max",
];

const getTokenName = (key: SpaceKey) =>
  key === "max" ? "space-max" : /^\d+px$/.test(key) ? `space-[${key}]` : `space-${key}`;

const getCssVarName = (key: SpaceKey) =>
  key === "max" ? "--spacing-max" : /^\d+px$/.test(key) ? `--spacing-${key}` : `--spacing-${key}`;

const meta: Meta = {
  title: "Design Tokens/Spacing",
};

export default meta;

export const AllSpacing = () => (
  <div
    style={{
      display: "grid",
      gap: "var(--space-6)",
      padding: "var(--space-6)",
      color: "var(--color-semantic-label-normal)",
      background: "var(--color-semantic-background-normal-normal)",
    }}
  >
    <div>
      <Label1Normal>Spacing Modes</Label1Normal>
      <Body1Normal $color="var(--color-semantic-label-alternative)">
        4 또는 8의 배수를 원칙으로 하며, 상황에 따라 2의 배수 간격을 사용합니다.
      </Body1Normal>
    </div>

    <div
      style={{
        display: "grid",
        gap: 0,
        maxWidth: 720,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "120px 80px minmax(0, 1fr)",
          alignItems: "center",
          minHeight: 40,
          borderBottom: "1px solid var(--color-semantic-line-normal-normal)",
        }}
      >
        <Label1Normal>Name</Label1Normal>
        <Label1Normal>Size</Label1Normal>
        <Label1Normal>Preview</Label1Normal>
      </div>

      {orderedSpaceKeys.map((key) => (
        <div
          key={key}
          style={{
            display: "grid",
            gridTemplateColumns: "120px 80px minmax(0, 1fr)",
            alignItems: "center",
            minHeight: 40,
            borderBottom: "1px solid var(--color-semantic-line-normal-alternative)",
          }}
        >
          <Label2>{getTokenName(key)}</Label2>
          <Label2>{space[key]}px</Label2>
          <div
            style={{
              width: `min(var(${getCssVarName(key)}), 100%)`,
              height: 12,
              background: "var(--color-semantic-status-negative)",
            }}
          />
        </div>
      ))}
    </div>
  </div>
);
