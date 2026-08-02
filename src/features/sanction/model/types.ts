/**
 * 제재 단계.
 * - WARNING: 계정 이용 가능. 기간 중 퀴즈 답변/초기화만 차단(code 6008)
 * - SUSPENSION: 대부분의 보호 API 403(code 6006). 종료 시각 있음
 * - PERMANENT_BAN: 대부분의 보호 API 403(code 6007). 종료 시각 없음
 */
export type SanctionLevel = "WARNING" | "SUSPENSION" | "PERMANENT_BAN";

export type EffectiveSanction = {
  level: SanctionLevel;
  levelDescription: string;
  /** 직권 제재는 null일 수 있다. */
  reason: string | null;
  reasonDescription: string | null;
  /** yyyy-MM-dd HH:mm:ss */
  startsAt: string;
  /** 영구 차단은 null. yyyy-MM-dd HH:mm:ss */
  endsAt: string | null;
};

/** 유효한 제재가 없으면 sanction이 null이다. */
export type MySanctionResponse = {
  sanction: EffectiveSanction | null;
};

/** OAuth 콜백 쿼리로 전달되는 제재 정보. 이때는 토큰이 없어 API 조회가 불가능하다. */
export type SanctionCallback = {
  sanctionCode: "MEMBER_SUSPENDED" | "MEMBER_BANNED";
  /** ISO-8601. MEMBER_BANNED면 없음. */
  suspendedUntil: string | null;
};
