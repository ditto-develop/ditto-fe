/** TEXT 메시지 최대 길이. 초과 시 BE가 code 0001로 거절한다. */
export const CHAT_TEXT_MAX_LENGTH = 1000;

/** 이미지 1장당 최대 크기(10MB). */
export const CHAT_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** 한 번에 발급 가능한 업로드 URL 개수. */
export const CHAT_IMAGE_MAX_COUNT = 10;

/** 메시지 페이지 크기. BE 기본 30, 최대 100. */
export const CHAT_PAGE_SIZE = 30;

/**
 * 그룹 만남 투표 기능 스위치.
 *
 * 그룹 채팅 자체는 `/api/v1/chat/rooms` 계약으로 라이브지만, 투표는 BE에 계약이 없다
 * (라이브 swagger·BE 위키 어디에도 없음 — INTEGRATION-TODO.md §A-2).
 * 투표 UI는 구 백엔드 경로(`/api/chat/group-rooms/{id}/votes`)를 호출하도록 남아 있어
 * 그대로 노출하면 라이브에서 404 버튼이 된다. BE 엔드포인트가 생기면 이 값을 true로 올리고
 * 투표 컴포넌트들을 externalApiFetch로 옮긴다.
 */
export const GROUP_VOTE_ENABLED = false;
