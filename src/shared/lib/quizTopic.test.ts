import { describe, expect, it } from "vitest";

import { DEFAULT_QUIZ_TOPIC_LABEL, toGroupName, toQuizTopicLabel } from "@/shared/lib/quizTopic";

/** 그룹 채팅방 이름(서버 roomName)이 퀴즈셋 title 이라, 퀴즈 시트·그룹 이름도 title 을 쓴다. */
describe("toQuizTopicLabel", () => {
  it("title 이 있으면 category 보다 먼저 쓴다", () => {
    expect(
      toQuizTopicLabel({ matchingType: "GROUP", title: "주말을 보내는 방식", category: "취미, 취향" }),
    ).toBe("주말을 보내는 방식");
  });

  it("title 이 비면 category 로 떨어진다", () => {
    expect(toQuizTopicLabel({ matchingType: "ONE_TO_ONE", title: "  ", category: "성격, 가치관" })).toBe(
      "성격, 가치관",
    );
  });

  it("둘 다 비면 종류별 기본 문구를 쓴다", () => {
    expect(toQuizTopicLabel({ matchingType: "GROUP" })).toBe(DEFAULT_QUIZ_TOPIC_LABEL.GROUP);
    expect(toQuizTopicLabel({ matchingType: "ONE_TO_ONE", title: "", category: "" })).toBe(
      DEFAULT_QUIZ_TOPIC_LABEL.ONE_TO_ONE,
    );
  });

  it("그룹 이름은 같은 주제 문구로 짓는다", () => {
    expect(toGroupName(toQuizTopicLabel({ matchingType: "GROUP", title: "여행, 음식" }))).toBe(
      "같은 여행, 음식 그룹",
    );
  });
});
