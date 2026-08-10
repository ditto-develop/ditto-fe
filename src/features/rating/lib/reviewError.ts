import { API_ERROR_CODE, getApiErrorCode, isApiError } from "@/shared/lib/api/apiError";

export type ReviewErrorKind =
  /** 이미 확정된 답변 — 화면을 확정 상태로 되돌려야 한다 */
  | "already-answered"
  /** 값 검증 실패 — 서버 message를 그대로 노출해도 된다 */
  | "invalid-value"
  /** 없는 평가 / 남의 평가 */
  | "not-found"
  /** 서버 데이터 정합 문제 — 재시도가 아니라 오류 보고가 맞다 */
  | "inconsistent"
  | "unknown";

export interface ReviewErrorInfo {
  kind: ReviewErrorKind;
  message: string;
}

/**
 * 평가 제출 실패를 화면 문구로 바꾼다.
 *
 * 1001(경로 변수가 숫자가 아님)은 error.message가 "지원하지 않는 소셜 로그인
 * 제공자입니다."로 내려온다. 그대로 노출하면 안 되므로 8002만 message를 쓴다.
 */
export function toReviewError(error: unknown): ReviewErrorInfo {
  const code = getApiErrorCode(error);

  if (code === API_ERROR_CODE.REVIEW_ALREADY_ANSWERED) {
    return { kind: "already-answered", message: "이미 제출한 평가는 수정할 수 없습니다." };
  }

  if (code === API_ERROR_CODE.REVIEW_INVALID_VALUE) {
    const message = isApiError(error) ? error.message : "";
    return { kind: "invalid-value", message: message || "입력값을 다시 확인해 주세요." };
  }

  if (code === API_ERROR_CODE.REVIEW_NOT_FOUND) {
    return { kind: "not-found", message: "평가를 찾을 수 없어요." };
  }

  if (code === API_ERROR_CODE.REVIEW_INVALID_TARGET) {
    return { kind: "inconsistent", message: "평가를 처리할 수 없어요. 문제가 계속되면 문의해 주세요." };
  }

  return { kind: "unknown", message: "평가를 제출하지 못했어요. 다시 시도해 주세요." };
}
