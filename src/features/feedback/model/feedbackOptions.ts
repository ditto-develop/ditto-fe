import type { FeedbackTypeOption } from "@/features/feedback/model/types";

/** 의견 유형(순서 고정). value는 BE type 값과 1:1로 대응한다. */
export const FEEDBACK_TYPES: FeedbackTypeOption[] = [
  {
    value: "bug",
    emoji: "🐞",
    label: "버그 제보",
    description: "앱이 멈추거나 화면이 이상하게 보여요",
  },
  {
    value: "suggestion",
    emoji: "💡",
    label: "개선 제안",
    description: "이런 기능이 있으면 좋겠어요",
  },
  {
    value: "etc",
    emoji: "💬",
    label: "기타",
    description: "그 밖에 전하고 싶은 이야기",
  },
];

/** 내용 최대 길이. BE content 최대 1000자. */
export const FEEDBACK_CONTENT_MAX_LENGTH = 1000;

/** 스크린샷 최대 개수. BE files·imageKeys 최대 3개. */
export const FEEDBACK_IMAGE_MAX_COUNT = 3;

/** 스크린샷 1장당 최대 크기(5 MiB). BE contentLength 최대 5242880. */
export const FEEDBACK_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
