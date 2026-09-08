/**
 * BE 공통 에러 계약.
 *
 * BE는 두 방식으로 오류를 내려준다.
 * - 컨트롤러 내부 검증/비즈니스 오류: HTTP 200 + `success:false`
 * - JWT / API Key / 제재 게이트: 실제 HTTP 401·403
 *
 * 따라서 HTTP status만으로 성공을 판단하면 안 되고, 항상 body의 `success`와
 * `error.code`를 함께 봐야 한다. 두 경우 모두 이 ApiError로 정규화한다.
 */
export class ApiError extends Error {
  /** BE가 내려준 도메인 에러 코드(예: "6002"). 없으면 빈 문자열. */
  readonly code: string;
  /** error.statusCode 우선, 없으면 실제 HTTP status. */
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * 로그에 남길 수 있는 형태로 요약한다.
 *
 * `console.error("...", err)` 로 에러 객체를 그대로 넘기면 **앱 웹뷰 콘솔에서 `{}` 로 찍힌다**
 * — Error 의 name·message 가 열거 불가라 직렬화에서 사라지고, 네트워크 실패(TypeError)는
 * 애초에 담을 필드가 없다. 2026-09-07 기기 디버깅에서 실패 원인을 못 본 이유가 이것이다.
 * 사람이 읽을 문자열로 바꿔서 넘긴다.
 */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    return `ApiError code=${err.code || "-"} status=${err.status} message=${err.message}`;
  }
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err) ?? String(err);
  } catch {
    return String(err);
  }
}

export const API_ERROR_CODE = {
  /** 잘못된 요청값(필수값·파일 규칙·reason/source) */
  INVALID_REQUEST: "0001",
  /** 권한 없음(차단된 상대의 프로필 조회, 본인이 아닌 회원 탈퇴 등) */
  FORBIDDEN: "0003",
  /** 대상 없음 */
  NOT_FOUND: "0004",
  /** 자기 자신 신고 */
  REPORT_SELF: "6001",
  /** 동일 대상의 검토 대기 신고가 이미 존재 */
  REPORT_DUPLICATE: "6002",
  /** reason=etc인데 detail 누락 */
  REPORT_DETAIL_REQUIRED: "6003",
  /** 이미지 3장 초과 */
  REPORT_TOO_MANY_IMAGES: "6004",
  /** objectKey가 잘못되었거나 업로드 미완료 */
  REPORT_INVALID_IMAGE_KEY: "6005",
  /** 이용 정지된 계정 */
  SANCTION_SUSPENDED: "6006",
  /** 영구 차단된 계정 */
  SANCTION_BANNED: "6007",
  /** 제재로 이번 주 퀴즈 참여 불가 */
  SANCTION_QUIZ_BLOCKED: "6008",
  /**
   * 탈퇴 거부. 남은 1:1 매칭 / 끝나지 않은 채팅방 / 재매칭 성사 후 방 미생성 셋 다
   * 같은 코드·메시지라 서버 응답만으로는 원인을 가릴 수 없다.
   */
  LEAVE_BLOCKED: "6011",
  /** 탈퇴한 회원의 토큰으로 보호 API 접근(토큰 갱신도 동일). 재가입 외 복구 경로는 없다. */
  MEMBER_LEFT: "6012",
  /** 평가 대상이 아님 / 그룹인데 재매칭 쌍이 없음(후자는 서버 정합 문제) */
  REVIEW_INVALID_TARGET: "8001",
  /** 별점 범위·코멘트 길이·재매칭 의사 누락/금지 위반 — message를 그대로 노출해도 된다 */
  REVIEW_INVALID_VALUE: "8002",
  /** 없는 평가 / 남의 평가(존재 여부를 숨기려 403이 아닌 404) */
  REVIEW_NOT_FOUND: "8004",
  /** 이미 확정한 답변을 다른 내용으로 재제출 */
  REVIEW_ALREADY_ANSWERED: "8005",
  /**
   * 내 것이 아닌 디바이스 토큰 해제 시도.
   *
   * 공용 기기에서 계정을 바꾸면 토큰 소유자가 새 회원으로 넘어간다. 그 뒤 이전 계정의
   * 로그아웃 처리가 같은 토큰을 해제하려 하면 이 코드가 온다 — **정상 경로이며
   * 실패로 노출하면 안 된다**(BE 위키 Frontend-Push-Guide §2).
   */
  DEVICE_NOT_OWNED: "8301",
  /**
   * 세션(accessToken)은 유효하지만 회원가입이 완료되지 않은 계정.
   * 로그인 응답의 signupRequired와 별개로, 홈 데이터 등 보호 API 쪽에서 이 코드로 막힌 계정이
   * 실제로 존재한다(2026-09-08 실기기 로그로 확인) — signupRequired:false로 로그인시켜 놓고
   * 이후 모든 보호 API가 이 코드로 거부해 홈이 카드 없이 빈 화면으로 보였다.
   */
  SIGNUP_INCOMPLETE: "3001",
} as const;

/** 세션 전체를 막는 제재 코드(전역 인터셉트 대상). 6008은 퀴즈 인라인이라 제외한다. */
export const BLOCKING_SANCTION_CODES: readonly string[] = [
  API_ERROR_CODE.SANCTION_SUSPENDED,
  API_ERROR_CODE.SANCTION_BANNED,
];

/**
 * 제재(6006/6007)는 특정 화면이 아니라 세션 전체에 걸린다.
 * api 레이어가 feature/라우터를 직접 알지 않도록 이벤트만 쏘고,
 * SanctionGate가 받아 제재 안내 화면으로 보낸다.
 * externalClient와 generated client 양쪽에서 모두 사용한다.
 */
export const SANCTION_EVENT = "ditto:sanctioned";

export function notifySanctionedIfBlocked(code: string): void {
  if (typeof window === "undefined") return;
  if (!BLOCKING_SANCTION_CODES.includes(code)) return;
  window.dispatchEvent(new CustomEvent(SANCTION_EVENT, { detail: { code } }));
}

/**
 * SIGNUP_INCOMPLETE(3001)도 제재와 같은 성격이다 — 특정 화면이 아니라 세션 전체에 걸린다.
 * api 레이어가 feature/라우터를 직접 알지 않도록 이벤트만 쏘고, SignupIncompleteGate가 받아
 * 회원가입 화면으로 보낸다.
 */
export const SIGNUP_INCOMPLETE_EVENT = "ditto:signup-incomplete";

export function notifySignupIncompleteIfBlocked(code: string): void {
  if (typeof window === "undefined") return;
  if (code !== API_ERROR_CODE.SIGNUP_INCOMPLETE) return;
  window.dispatchEvent(new CustomEvent(SIGNUP_INCOMPLETE_EVENT));
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorCode(error: unknown): string {
  return isApiError(error) ? error.code : "";
}

export function hasApiErrorCode(error: unknown, ...codes: string[]): boolean {
  return codes.includes(getApiErrorCode(error));
}
