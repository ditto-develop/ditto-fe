/** TEXT 메시지 최대 길이. 초과 시 BE가 code 0001로 거절한다. */
export const CHAT_TEXT_MAX_LENGTH = 1000;

/** 이미지 1장당 최대 크기(10MB). */
export const CHAT_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** 한 번에 발급 가능한 업로드 URL 개수. */
export const CHAT_IMAGE_MAX_COUNT = 10;

/** 메시지 페이지 크기. BE 기본 30, 최대 100. */
export const CHAT_PAGE_SIZE = 30;
