/** Spacing tokens matching the Figma Spacing Modes scale. */
export const space = {
  "0": 0,
  "1px": 1,
  "2px": 2,
  "1": 4,
  "6px": 6,
  "2": 8,
  "10px": 10,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
  "14": 56,
  "16": 64,
  "18": 72,
  "20": 80,
  "24": 96,
  "28": 112,
  "30": 120,
  "32": 128,
  "36": 144,
  "40": 160,
  "48": 192,
  "52": 208,
  "56": 224,
  "64": 256,
  "72": 288,
  "80": 320,
  max: 420,
} as const;

/** Backward-compatible spacing aliases plus Figma spacing keys. */
export const spacing = {
  ...space,
  xs: space["1"],
  sm: space["2"],
  md: space["3"],
  base: space["4"],
  lg: space["5"],
  xl: space["6"],
  "2xl": space["8"],
  "3xl": space["12"],
  "4xl": space["16"],
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
export type SpaceKey = keyof typeof space;
export type RadiusKey = keyof typeof radius;
