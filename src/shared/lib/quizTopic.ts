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
 * 퀴즈 세트의 주제 문구. `category` 가 있으면 그걸 쓰고, 없으면 `title` 로 간다
 * (2026-09-18 요청). 둘 다 비면 기본 문구로 떨어진다.
 */
export function toQuizTopicLabel(quizSet: { matchingType: unknown; category?: string; title?: string }): string {
  const category = quizSet.category?.trim();
  if (category) return category;

  const title = quizSet.title?.trim();
  if (title) return title;

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
