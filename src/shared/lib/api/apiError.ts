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

export const API_ERROR_CODE = {
  /** 잘못된 요청값(필수값·파일 규칙·reason/source) */
  INVALID_REQUEST: "0001",
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

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiErrorCode(error: unknown): string {
  return isApiError(error) ? error.code : "";
}

export function hasApiErrorCode(error: unknown, ...codes: string[]): boolean {
  return codes.includes(getApiErrorCode(error));
}
