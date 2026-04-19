"use client";

import styled from "styled-components";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
    src?: string;
    alt?: string;
    size?: AvatarSize;
    className?: string;
}

const sizeMap: Record<AvatarSize, number> = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 100,
};

/**
 * Avatar — Figma: Avatar/Avatar
 * 원형 프로필 이미지. 매칭 카드(80px), 소개노트(100px) 등에서 사용.
 */
export function Avatar({ src, alt = "프로필", size = "lg", className }: AvatarProps) {
  console.log('[src/shared/ui/Avatar/Avatar.tsx] Avatar'); // __component_log__
    const px = sizeMap[size];
    return (
        <AvatarContainer $size={px} className={className}>
            {src ? (
                <AvatarImage src={src} alt={alt} $size={px} />
            ) : (
                <Placeholder $size={px}>
                    <PlaceholderImg src="/profile/default-avatar.svg" alt={alt} />
                </Placeholder>
            )}
        </AvatarContainer>
    );
}

const AvatarContainer = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--color-semantic-background-normal-normal);
  border: 1px solid var(--color-semantic-line-normal-alternative);
  box-sizing: border-box;
`;

const AvatarImage = styled.img<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  object-fit: cover;
  display: block;
`;

const Placeholder = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-semantic-background-elevated-alternative);
`;

const PlaceholderImg = styled.img`
  width: 60%;
  height: 60%;
  opacity: 0.5;
`;
