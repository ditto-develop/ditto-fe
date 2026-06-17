"use client";

import styled from "styled-components";
import type { ReactNode } from "react";

type BadgeVariant = "positive" | "cautionary" | "destructive" | "navy" | "neutral";

interface ContentBadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    icon?: string;
    className?: string;
}

const bgColorMap: Record<BadgeVariant, string> = {
    positive: "rgb(from var(--color-semantic-status-positive) r g b / var(--color-atomic-opacity-8))",
    cautionary: "rgb(from var(--color-semantic-status-cautionary) r g b / var(--color-atomic-opacity-8))",
    destructive: "rgb(from var(--color-semantic-status-negative) r g b / var(--color-atomic-opacity-8))",
    navy: "rgb(from var(--color-semantic-accent-foreground-Navy) r g b / var(--color-atomic-opacity-8))",
    neutral: "var(--color-semantic-fill-normal)",
};

const fgColorMap: Record<BadgeVariant, string> = {
    positive: "var(--color-semantic-status-positive)",
    cautionary: "var(--color-semantic-status-cautionary)",
    destructive: "var(--color-semantic-status-negative)",
    navy: "var(--color-semantic-accent-foreground-Navy)",
    neutral: "var(--color-semantic-label-alternative)",
};

/**
 * ContentBadge — Figma: Content Badge/Content Badge
 * 매칭 일치율("😍 당신과 가장 비슷해요"), 프로필 태그("운동", "영화/드라마") 등에 사용.
 */
export function ContentBadge({
    children,
    variant = "neutral",
    icon,
    className,
}: ContentBadgeProps) {
    return (
        <Badge $variant={variant} className={className}>
            {icon && <BadgeIcon>{icon}</BadgeIcon>}
            <BadgeText $variant={variant}>{children}</BadgeText>
        </Badge>
    );
}

const Badge = styled.div<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  gap: 4px;
  border-radius: 8px;
  height: 28px;
  background-color: ${({ $variant }) => bgColorMap[$variant]};
`;

const BadgeIcon = styled.span`
  font-size: var(--typography-label-2-font-size);
  line-height: 1;
`;

const BadgeText = styled.span<{ $variant: BadgeVariant }>`
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  color: ${({ $variant }) => fgColorMap[$variant]};
`;
