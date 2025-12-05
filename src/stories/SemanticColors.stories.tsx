import React, { useEffect, useState } from "react";

// Semantic Color 한 개 타입
type SemanticColor = {
  name: string;  // --color-primary-normal
  value: string; // 실제 색 값 (#..., rgba(...), var(...))
};

const SemanticColorBox: React.FC<SemanticColor> = ({ name, value }) => {
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

const SemanticColorPalette: React.FC = () => {
  const [colors, setColors] = useState<SemanticColor[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const style = getComputedStyle(document.documentElement);
    const list: SemanticColor[] = [];

    for (let i = 0; i < style.length; i++) {
      const prop = style[i];

      // color 변수만 골라서
      if (!prop.startsWith("--color-")) continue;
      // atomic 은 제외 → semantic 만
      if (prop.includes("-atomic-")) continue;

      const value = style.getPropertyValue(prop).trim();
      if (!value) continue;

      list.push({ name: prop, value });
    }

    list.sort((a, b) => a.name.localeCompare(b.name));
    setColors(list);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Semantic Colors
      </h1>
      <p style={{ fontSize: 12, color: "#777", marginBottom: 16 }}>
        :root 에 정의된 시멘틱 컬러 토큰들을 자동으로 읽어서 보여줍니다.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: 12,
        }}
      >
        {colors.map((c) => (
          <SemanticColorBox key={c.name} {...c} />
        ))}
      </div>
    </div>
  );
};

export default {
  title: "Design Tokens/Semantic Colors",
  component: SemanticColorPalette,
};

export const AllSemanticColors = () => <SemanticColorPalette />;
