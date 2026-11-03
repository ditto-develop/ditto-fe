"use client";

import { QuizRecordsContainer } from "@/features/records/containers/QuizRecordsContainer";
import { useFeatureGate } from "@/shared/lib/hooks/useFeatureFlag";

/**
 * 8.1 기록 탭. 공개 전 기능이라 테스터 모드가 아니면 /home 으로 보낸다(CLAUDE.md §9.1).
 * 정적 export 라 이 HTML 은 플래그와 상관없이 올라가므로 주소·딥링크로 들어와도 여기서 막는다.
 * 컨테이너를 따로 두는 건 막힌 기기에서 기록 API 를 부르지 않게 하려는 것이다.
 */
export function RecordsPageClient() {
  const allowed = useFeatureGate("records");
  if (!allowed) return null;
  return <QuizRecordsContainer />;
}
