"use client";

import { useEffect, useState } from "react";

import { getReportTarget } from "@/features/report/api/reportApi";
import type { ReportTarget } from "@/features/report/model/types";

type UseReportTargetResult = {
  target: ReportTarget | null;
  loading: boolean;
  error: boolean;
};

export function useReportTarget(userId: number): UseReportTargetResult {
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // reportedMemberId는 int64다. 라우트 세그먼트가 숫자가 아니면 호출하지 않는다.
    if (!Number.isFinite(userId)) {
      setLoading(false);
      setError(true);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError(false);

    getReportTarget(userId)
      .then((data) => {
        if (active) setTarget(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  return { target, loading, error };
}
