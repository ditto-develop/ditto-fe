/** BE 의견 유형. 대소문자를 구분한다("BUG"는 0001). */
export type FeedbackType = "bug" | "suggestion" | "etc";

export type FeedbackTypeOption = {
  value: FeedbackType;
  emoji: string;
  label: string;
  description: string;
};

/**
 * 앱이 자동으로 채우는 기기 정보. 셋 다 선택값이라 얻지 못한 값은 키를 빼고 보낸다.
 * 운영자가 버그를 재현할 때 가장 먼저 보는 값이다(BE 위키 Frontend-Feedback-Guide §3).
 */
export type FeedbackDeviceInfo = {
  /** 앱 셸 버전. 최대 30자. 웹에는 셸이 없어 빠진다. */
  appVersion?: string;
  /** "<플랫폼> <버전>". 예: "iOS 18.2", "Android 15". 최대 30자. */
  os?: string;
  /** OS가 주는 모델 식별자. 예: "SM-S928N". 최대 50자. */
  deviceModel?: string;
};

/** POST /api/v1/feedbacks */
export type CreateFeedbackRequest = FeedbackDeviceInfo & {
  type: FeedbackType;
  /** 최대 1000자, 공백만은 안 된다. */
  content: string;
  /** 업로드 URL 발급에서 받은 objectKey 그대로. 최대 3개, 없으면 []. null 은 0001. */
  imageKeys: string[];
};

export type CreateFeedbackResponse = {
  id: number;
};
