import React, { useEffect, useState } from "react";

type AtomicColor = {
  name: string;   // --color-atomic-blue-60
  value: string;  // #3385FF
};

const AtomicColorBox: React.FC<AtomicColor> = ({ name, value }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 8,
        borderRadius: 8,
        border: "1px solid #e5e5e5",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          backgroundColor: value,
          border: "1px solid #ddd",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <strong style={{ fontSize: 13 }}>{name}</strong>
        <span style={{ fontSize: 12, color: "#666" }}>{value}</span>
      </div>
    </div>
  );
};

const AtomicColorPalette: React.FC = () => {
  const [colors, setColors] = useState<AtomicColor[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const style = getComputedStyle(document.documentElement);
    const list: AtomicColor[] = [];

    for (let i = 0; i < style.length; i++) {
      const prop = style[i];

      // --color-atomic- 로 시작하는 것만
      if (!prop.startsWith("--color-atomic-")) continue;

      // opacity 토큰은 색상 박스로 안 보고 싶으면 필터
      if (prop.includes("opacity")) continue;

      const value = style.getPropertyValue(prop).trim();

      if (!value) continue;

      list.push({
        name: prop,
        value,
      });
    }

    // 보기 좋게 정렬 (옵션)
    list.sort((a, b) => a.name.localeCompare(b.name));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColors(list);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Atomic Colors
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {colors.map((c) => (
          <AtomicColorBox key={c.name} {...c} />
        ))}
      </div>
    </div>
  );
};

export default {
  title: "Design Tokens/Atomic Colors",
  component: AtomicColorPalette,
};

export const AllAtomicColors = () => <AtomicColorPalette />;
