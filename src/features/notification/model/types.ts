/** 알림 필터 탭. `ALL`은 필터 없음. */
export type NotificationFilter = "ALL" | "MATCHING" | "CHAT" | "SYSTEM";

/**
 * 알림 종류. 목록의 leading 아이콘과 필터 분류를 결정한다.
 * Figma 7.2 알림 센터 [2508:31674]의 8개 행에 대응한다.
 */
export type NotificationType =
  | "MATCH_RESULT"
  | "NEW_MESSAGE"
  | "GROUP_FORMED"
  | "VOTE_RESULT"
  | "RATING_REQUEST"
  | "REMATCH_SUCCESS"
  | "CHAT_CLOSING"
  | "APP_UPDATE";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO 8601. 상대 시간 표기와 오늘/지난 소식 분류의 기준. */
  createdAt: string;
  read: boolean;
  /** 탭했을 때 이동할 앱 내 경로. 없으면 이동하지 않는다. */
  linkTo: string | null;
};

/** 오늘 / 지난 소식 두 구간으로 나뉜 목록. */
export type NotificationSection = {
  key: "TODAY" | "EARLIER";
  label: string;
  items: NotificationItem[];
};
