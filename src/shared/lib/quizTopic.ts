/** 퀴즈 종류. 서버 퀴즈 세트의 matchingType 과 같은 값이다. */
export type QuizMatchingType = "ONE_TO_ONE" | "GROUP";

/**
 * 주제를 못 읽었을 때만 쓰는 문구. 예전에는 이 두 줄이 하드코딩돼 있어서, 어드민이
 * 다른 주제의 세트를 올려도 시트에는 늘 같은 이름표가 찍혔다.
 */
export const DEFAULT_QUIZ_TOPIC_LABEL: Record<QuizMatchingType, string> = {
  ONE_TO_ONE: "성격, 가치관",
  GROUP: "취미, 취향",
};

/**
 * 퀴즈 세트의 주제 문구. `title` 을 쓴다 — 그룹 채팅방 이름(서버 `roomName`)이 퀴즈셋 `title` 이라
 * 퀴즈 시트·그룹 이름·채팅방이 같은 이름을 보여 주게 맞췄다(2026-10-19). 9/18 부터 10/19 까지는
 * `category` 를 먼저 썼다.
 *
 * 서버는 두 값을 모두 필수로 두지만, 비어 오면 `category` 로, 그것도 비면 기본 문구로 떨어진다.
 */
export function toQuizTopicLabel(quizSet: { matchingType: unknown; category?: string; title?: string }): string {
  const title = quizSet.title?.trim();
  if (title) return title;

  const category = quizSet.category?.trim();
  if (category) return category;

  const type = String(quizSet.matchingType);
  return type === "GROUP"
    ? DEFAULT_QUIZ_TOPIC_LABEL.GROUP
    : DEFAULT_QUIZ_TOPIC_LABEL.ONE_TO_ONE;
}

/** 그룹 카드·모달의 그룹 이름. 퀴즈 시트와 같은 주제 문구를 쓴다("같은 {주제} 그룹"). */
export function toGroupName(topicLabel: string): string {
  return `같은 ${topicLabel} 그룹`;
}

export const DEFAULT_GROUP_NAME = toGroupName(DEFAULT_QUIZ_TOPIC_LABEL.GROUP);
