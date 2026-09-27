"use client";

import { useEffect, useState } from "react";
import { fetchExternalCurrentWeekQuizSets } from "@/shared/lib/api/externalApi";
import { DEFAULT_GROUP_NAME, toGroupName, toQuizTopicLabel } from "@/shared/lib/quizTopic";

/**
 * 그룹 매칭의 그룹 이름("같은 {주제} 그룹"). 주제는 퀴즈 시트와 같은 규칙으로
 * 이번 주 퀴즈셋의 `category`(없으면 `title`)에서 가져온다.
 *
 * 그룹 후보 응답이 주는 `quizSetId` 로 세트를 고르고, 못 찾으면 GROUP 세트로 간다.
 * 둘 다 없거나 조회가 실패하면 기본 문구("같은 취미, 취향 그룹")를 쓴다.
 */
export function useGroupName(quizSetId: string | null | undefined): string {
  const [groupName, setGroupName] = useState(DEFAULT_GROUP_NAME);

  useEffect(() => {
    if (!quizSetId) return;
    let ignore = false;
    fetchExternalCurrentWeekQuizSets()
      .then(({ quizSets }) => {
        if (ignore) return;
        const sets = quizSets ?? [];
        const quizSet =
          sets.find((set) => String(set.id) === quizSetId) ??
          sets.find((set) => String(set.matchingType) === "GROUP");
        setGroupName(quizSet ? toGroupName(toQuizTopicLabel(quizSet)) : DEFAULT_GROUP_NAME);
      })
      .catch(() => {
        if (!ignore) setGroupName(DEFAULT_GROUP_NAME);
      });
    return () => {
      ignore = true;
    };
  }, [quizSetId]);

  return groupName;
}
