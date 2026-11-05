import type {
  QuizCompareResponse,
  QuizDistributionResponse,
  QuizHistoryDetail,
  QuizHistoryResponse,
} from "@/features/records/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/*
 * 8.1 퀴즈 기록 · 대화방 답변 비교 API(서버 IMP-1, ditto-server #366).
 * 화면이 서버 `RECORDS` 플래그 뒤에 있어, 켜져 있을 때만 부른다.
 * 질문 카드 전송은 REST 가 아니라 STOMP 프레임이다(`useChatRoom.sendQuizCard`).
 */

/** 기록 탭: 상단 요약 + 이번 주 + 끝까지 푼 퀴즈셋 목록(최신 주 먼저). */
export function getQuizHistory(): Promise<QuizHistoryResponse> {
  return externalApiFetch<QuizHistoryResponse>("/api/v1/quiz-history");
}

/** 퀴즈셋 하나의 내 답과(마감 뒤에는) 선택 비율. 끝까지 풀지 않은 퀴즈셋이면 404(4006). */
export function getQuizHistoryDetail(quizSetId: number): Promise<QuizHistoryDetail> {
  return externalApiFetch<QuizHistoryDetail>(`/api/v1/quiz-history/${quizSetId}`);
}

/**
 * 1:1·재매칭 방의 문항별 답 비교. 끝난 방 409(7004), 상대 탈퇴·차단 409(7008), 그룹 방 400(7009),
 * 방의 퀴즈셋 없음 404(7012).
 */
export function getQuizCompare(roomId: number): Promise<QuizCompareResponse> {
  return externalApiFetch<QuizCompareResponse>(`/api/v1/chat/rooms/${roomId}/quiz-compare`);
}

/** 그룹 방의 문항별 답 분포(인원 수만). 오류 코드는 `getQuizCompare` 와 같다. */
export function getQuizDistribution(roomId: number): Promise<QuizDistributionResponse> {
  return externalApiFetch<QuizDistributionResponse>(
    `/api/v1/chat/rooms/${roomId}/quiz-distribution`,
  );
}
