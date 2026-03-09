"use client";

import styled from "styled-components";
import { ReactNode } from "react";

type BadgeVariant = "positive" | "cautionary" | "destructive" | "navy" | "neutral";

interface ContentBadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    icon?: string;
    className?: string;
}

const bgColorMap: Record<BadgeVariant, string> = {
    positive: "rgba(85, 122, 85, 0.08)",
    cautionary: "rgba(235, 90, 60, 0.08)",
    destructive: "rgba(179, 53, 40, 0.08)",
    navy: "rgba(58, 73, 120, 0.08)",
    neutral: "rgba(108, 101, 95, 0.08)",
};

const fgColorMap: Record<BadgeVariant, string> = {
    positive: "var(--color-semantic-status-positive, #557A55)",
    cautionary: "var(--color-semantic-status-cautionary, #EB5A3C)",
    destructive: "var(--color-semantic-status-negative, #B33528)",
    navy: "var(--color-semantic-accent-foreground-Navy, #3A4978)",
    neutral: "var(--color-semantic-label-alternative)",
};

/**
 * ContentBadge — Figma: Content Badge/Content Badge
 * 매칭 일치율("😍 당신과 가장 비슷해요"), 프로필 태그("운동", "영화/드라마") 등에 사용.
 */
export default function ContentBadge({
    children,
    variant = "neutral",
    icon,
    className,
}: ContentBadgeProps) {
  console.log('[src/shared/ui/ContentBadge/ContentBadge.tsx] ContentBadge'); // __component_log__
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
  padding: 0 6px;
  gap: 4px;
  border-radius: 6px;
  height: 24px;
  background-color: ${({ $variant }) => bgColorMap[$variant]};
`;

const BadgeIcon = styled.span`
  font-size: 12px;
  line-height: 1;
`;

const BadgeText = styled.span<{ $variant: BadgeVariant }>`
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: ${({ $variant }) => fgColorMap[$variant]};
`;
