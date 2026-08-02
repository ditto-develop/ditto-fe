import { API_ERROR_CODE, getApiErrorCode, isApiError } from "@/shared/lib/api/apiError";

const FALLBACK = "제재로 인해 이번 주 퀴즈에 참여할 수 없습니다.";

/**
 * 경고(WARNING) 기간에는 퀴즈 답변/초기화가 code 6008로 거절된다.
 * 세션 전체를 막는 6006/6007과 달리 인라인 안내만 하고 다른 기능은 그대로 둔다.
 *
 * @returns 6008이면 사용자에게 보여줄 문구, 아니면 null
 */
export function getQuizSanctionMessage(error: unknown): string | null {
  if (getApiErrorCode(error) !== API_ERROR_CODE.SANCTION_QUIZ_BLOCKED) return null;
  return isApiError(error) && error.message ? error.message : FALLBACK;
}
