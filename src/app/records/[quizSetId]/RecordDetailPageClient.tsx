"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { QuizRecordDetailContainer } from "@/features/records/containers/QuizRecordDetailContainer";
import { useFeatureGate } from "@/shared/lib/hooks/useFeatureFlag";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";

function RecordDetailContent() {
  const params = useParams();
  // 정적 export 는 placeholder 페이지 하나만 만든다. 하드 로드면 useParams 가 "placeholder" 라
  // 실제 주소의 세그먼트로 보정한다(staticRouteParam.ts).
  const [quizSetId] = useState(() =>
    Number(resolveStaticRouteParam("records", String(params.quizSetId))),
  );
  return <QuizRecordDetailContainer quizSetId={quizSetId} />;
}

/**
 * 8.1 내 답변 보기 / 퀴즈 결과. 공개 전 기능이라 테스터 모드가 아니면 /home 으로 보낸다
 * (CLAUDE.md §9.1) — 푸시·딥링크로 바로 들어와도 막힌다.
 */
export function RecordDetailPageClient() {
  const allowed = useFeatureGate("records");
  if (!allowed) return null;
  return <RecordDetailContent />;
}
