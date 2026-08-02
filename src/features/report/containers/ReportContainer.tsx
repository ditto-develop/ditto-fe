"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useReportForm } from "@/features/report/hooks/useReportForm";
import { useReportTarget } from "@/features/report/hooks/useReportTarget";
import type { ReportResult, ReportSource } from "@/features/report/model/types";
import { ReportCompleteView } from "@/features/report/ui/ReportCompleteView";
import { ReportFormView } from "@/features/report/ui/ReportFormView";

interface ReportContainerProps {
  /** BE reportedMemberId (int64). */
  reportedMemberId: number;
  source?: ReportSource;
}

/**
 * 신고 플로우 컨트롤러.
 * 7.1 신고/차단 → 7.1.1 신고 완료는 같은 라우트의 단계로 다룬다.
 * (완료 화면은 접수 직후에만 의미가 있어 별도 딥링크가 필요 없다.)
 */
export function ReportContainer({ reportedMemberId, source = "profile" }: ReportContainerProps) {
  const router = useRouter();
  const { target } = useReportTarget(reportedMemberId);
  const form = useReportForm(reportedMemberId, target?.nickname ?? "", source);
  const [result, setResult] = useState<ReportResult | null>(null);

  const handleSubmit = async () => {
    const submitted = await form.submit();
    if (submitted) setResult(submitted);
  };

  if (result) {
    return <ReportCompleteView result={result} onConfirm={() => router.push("/home")} />;
  }

  return (
    <ReportFormView
      target={target}
      form={form}
      onCancel={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}
