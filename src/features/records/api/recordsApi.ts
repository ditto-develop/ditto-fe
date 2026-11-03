import type {
  QuizRecordDetail,
  QuizRecordsResponse,
  RoomQuizAnswers,
  ShareQuizRequest,
} from "@/features/records/model/types";
import type { ChatMessage } from "@/features/chat/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/*
 * 8.1 퀴즈 기록 API. 2026-11-03 기준 운영 BE 에 없다 — 요청서는 ditto-fe 위키
 * BE-Request-Quiz-Records. 화면이 테스터 모드 뒤에 있는 동안만 부른다.
 */

/** 기록 탭: 상단 요약 + 내가 끝까지 푼 퀴즈셋 목록(최신 주 먼저). */
export function getQuizRecords(): Promise<QuizRecordsResponse> {
  return externalApiFetch<QuizRecordsResponse>("/api/v1/quiz-records");
}

/** 퀴즈셋 하나의 내 답과(공개 후에는) 선택 비율. 내가 끝까지 풀지 않은 퀴즈셋이면 404. */
export function getQuizRecordDetail(quizSetId: number): Promise<QuizRecordDetail> {
  return externalApiFetch<QuizRecordDetail>(`/api/v1/quiz-records/${quizSetId}`);
}

/** 대화방 멤버들의 답을 문항별로. 퀴즈로 만들어진 방이 아니면 404. */
export function getRoomQuizAnswers(roomId: number): Promise<RoomQuizAnswers> {
  return externalApiFetch<RoomQuizAnswers>(`/api/v1/chat/rooms/${roomId}/quiz-answers`);
}

/**
 * 문항 하나를 대화방에 올린다. 서버가 `messageType: "QUIZ"` 메시지를 만들어 STOMP 로도
 * 방에 뿌린다 — 투표 생성이 SYSTEM 메시지를 남기는 것과 같은 방식이다.
 */
export function shareQuizToRoom(roomId: number, body: ShareQuizRequest): Promise<ChatMessage> {
  return externalApiFetch<ChatMessage>(`/api/v1/chat/rooms/${roomId}/quiz-shares`, {
    method: "POST",
    body,
  });
}
