"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { ReportContainer } from "@/features/report";
import type { ReportSource } from "@/features/report";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";

const REPORT_SOURCES: readonly ReportSource[] = ["profile", "match-result", "chat-room"];

/** 진입 화면은 BE source code로 그대로 전달된다. 모르는 값이면 기본값(profile)을 쓴다. */
function toReportSource(value: string | null): ReportSource {
  return REPORT_SOURCES.find((source) => source === value) ?? "profile";
}

function ReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  // BE reportedMemberId는 int64다. 라우트 세그먼트를 숫자로 변환해 넘긴다.
  const [reportedMemberId] = useState(() =>
    Number(resolveStaticRouteParam("report", String(params.userId))),
  );

  return (
    <ReportContainer
      reportedMemberId={reportedMemberId}
      source={toReportSource(searchParams.get("source"))}
    />
  );
}

export function ReportPageClient() {
  return (
    <Suspense>
      <ReportContent />
    </Suspense>
  );
}
