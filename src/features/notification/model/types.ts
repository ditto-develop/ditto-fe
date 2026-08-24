/** 서버 `category` 필드이자 필터 탭 값. */
export type NotificationCategory = "MATCHING" | "CHAT" | "SYSTEM";

/** 알림 필터 탭. `ALL`은 필터 없음(= category 파라미터 생략). */
export type NotificationFilter = "ALL" | NotificationCategory;

/**
 * 알림 유형. 라이브 스펙이 나열한 값은 아래 7종이지만 **enum은 늘어난다**.
 * 그래서 union으로 좁히지 않고 문자열로 받는다. 모르는 값은 기본 아이콘 +
 * 이동 없음으로 폴백해야 하며(BE 위키 명시), 렌더 자체를 건너뛰면 안 된다.
 *
 * MATCH_RESULT · GROUP_FORMED · REMATCH_MATCHED · REVIEW_REQUEST ·
 * CHAT_MESSAGE · CHAT_ENDING_SOON · SYSTEM_NOTICE
 */
export type NotificationType = string;

/** GET /api/v1/notifications 의 목록 항목. */
export type NotificationItem = {
  id: number;
  type: NotificationType;
  category: string;
  title: string;
  /** 스펙상 nullable. */
  body: string | null;
  /**
   * 이동 대상 ID. 무엇을 가리키는지는 type이 정한다(스펙 명시).
   * 채팅 계열은 방 ID다.
   */
  targetId: number | null;
  /** null이면 안 읽음. 서버 시각 문자열(`yyyy-MM-dd HH:mm:ss`). */
  readAt: string | null;
  /** 서버 시각 문자열. 상대 시간 표기와 오늘/지난 소식 분류의 기준. */
  createdAt: string;
};

/** 커서 페이지. `nextCursor`가 null이면 마지막 페이지다. */
export type NotificationPage = {
  notifications: NotificationItem[];
  nextCursor: string | null;
};

/** 오늘 / 지난 소식 두 구간으로 나뉜 목록. */
export type NotificationSection = {
  key: "TODAY" | "EARLIER";
  label: string;
  items: NotificationItem[];
};
