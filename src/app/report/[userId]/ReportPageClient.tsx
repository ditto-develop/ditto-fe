"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { ReportContainer } from "@/features/report";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";

export function ReportPageClient() {
  const params = useParams();
  // BE reportedMemberId는 int64다. 라우트 세그먼트를 숫자로 변환해 넘긴다.
  const [reportedMemberId] = useState(() =>
    Number(resolveStaticRouteParam("report", String(params.userId))),
  );

  return <ReportContainer reportedMemberId={reportedMemberId} source="profile" />;
}
