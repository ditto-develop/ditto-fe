/** Design spacing tokens matching Figma 16/24/32 rhythm */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
} as const;

/** Border radius tokens */
export const radius = {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
} as const;

/** Component height tokens */
export const heights = {
    topNav: 56,
    sectionHeader: 32,
    actionArea: 80,
    avatarSm: 32,
    avatarMd: 48,
    avatarLg: 80,
    avatarXl: 100,
    contentBadge: 24,
    contentBadgeLg: 28,
} as const;

/** Z-index tokens */
export const zIndex = {
    topNav: 1000,
    modal: 2000,
    toast: 3000,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
