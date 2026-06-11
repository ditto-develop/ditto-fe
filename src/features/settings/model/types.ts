export type NotificationSettings = {
  matching: boolean;
  chat: boolean;
  marketing: boolean;
};

export type NotificationSettingKey = keyof NotificationSettings;

export type BlockedUser = {
  id: string;
  nickname: string;
  profileImageUrl: string | null;
  blockedAt: string;
};

export type WithdrawReason = {
  value: string;
  label: string;
  comment: string;
};

export type PolicyBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "orderedList"; items: string[] }
  | { type: "bulletList"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "note"; text: string };
