import React from "react";
import { Icon, ICON_PATHS, type IconName } from "@/shared/ui";

const IconGallery = () => {
  const icons = Object.keys(ICON_PATHS) as IconName[];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Icons
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {icons.map((name) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              border: "1px solid var(--color-semantic-line-normal-neutral)",
              borderRadius: 8,
              color: "var(--color-semantic-label-normal)",
            }}
          >
            <Icon name={name} />
            <span style={{ fontSize: 13 }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const meta = {
  title: "Design Tokens/Icons",
  component: IconGallery,
};

export default meta;

export const AllIcons = () => <IconGallery />;
