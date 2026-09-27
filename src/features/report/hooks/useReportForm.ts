"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createUserReport, uploadReportEvidence } from "@/features/report/api/reportApi";
import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_EVIDENCE_MAX_COUNT,
  REPORT_EVIDENCE_MAX_SIZE_BYTES,
  REPORT_REASONS,
} from "@/features/report/model/reportReasons";
import type {
  ReportEvidence,
  ReportReason,
  ReportResult,
  ReportSource,
} from "@/features/report/model/types";
import { API_ERROR_CODE, getApiErrorCode } from "@/shared/lib/api/apiError";
import { useToast } from "@/context/ToastContext";

/** Figma 7.1 항목 미 입력 시 [2456:32028] + BE 에러 코드(PR #97) 문구. */
const MESSAGE = {
  reasonRequired: "신고 사유를 선택해 주세요.",
  fileTooLarge: "파일 크기는 5MB 이하여야 합니다.",
  detailRequired: "기타 사유는 상세 설명을 입력해 주세요.",
  tooManyImages: `증거는 최대 ${REPORT_EVIDENCE_MAX_COUNT}장까지 첨부할 수 있어요.`,
  uploadFailed: "증거 이미지를 올리지 못했어요. 다시 첨부해 주세요.",
  invalidRequest: "입력값을 다시 확인해 주세요.",
  selfReport: "본인은 신고할 수 없어요.",
  alreadyReported: "이미 신고한 사용자입니다.",
  submitFailed: "신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;

/** BE 에러 코드 → 사용자 문구. */
function toSubmitMessage(error: unknown): string {
  switch (getApiErrorCode(error)) {
    case API_ERROR_CODE.INVALID_REQUEST:
      return MESSAGE.invalidRequest;
    case API_ERROR_CODE.REPORT_SELF:
      return MESSAGE.selfReport;
    case API_ERROR_CODE.REPORT_DUPLICATE:
      return MESSAGE.alreadyReported;
    case API_ERROR_CODE.REPORT_DETAIL_REQUIRED:
      return MESSAGE.detailRequired;
    case API_ERROR_CODE.REPORT_TOO_MANY_IMAGES:
      return MESSAGE.tooManyImages;
    case API_ERROR_CODE.REPORT_INVALID_IMAGE_KEY:
      return MESSAGE.uploadFailed;
    default:
      return MESSAGE.submitFailed;
  }
}

type UseReportFormResult = {
  /** 고른 순서대로. 여러 개를 고를 수 있다. */
  reasons: ReportReason[];
  toggleReason: (reason: ReportReason) => void;
  detail: string;
  changeDetail: (value: string) => void;
  /** etc처럼 detail이 필수인 사유가 하나라도 선택됐는지. */
  detailRequired: boolean;
  evidence: ReportEvidence[];
  addEvidence: (files: FileList | File[]) => void;
  removeEvidence: (id: string) => void;
  canSubmit: boolean;
  submitting: boolean;
  submit: () => Promise<ReportResult | null>;
};

export function useReportForm(
  reportedMemberId: number,
  targetNickname: string,
  source: ReportSource = "profile",
): UseReportFormResult {
  const { showToast } = useToast();
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [detail, setDetail] = useState("");
  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 언마운트 시 objectURL 해제. evidence를 의존성에 넣으면 파일을 지울 때마다
  // 살아있는 URL까지 revoke되므로 ref로 최신 목록만 들고 있는다.
  const evidenceRef = useRef<ReportEvidence[]>([]);
  evidenceRef.current = evidence;
  useEffect(
    () => () => {
      evidenceRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  const detailRequired = useMemo(
    () =>
      REPORT_REASONS.some((option) => option.detailRequired && reasons.includes(option.value)),
    [reasons],
  );

  const toggleReason = useCallback((reason: ReportReason) => {
    setReasons((previous) =>
      previous.includes(reason) ? previous.filter((item) => item !== reason) : [...previous, reason],
    );
  }, []);

  const addEvidence = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      if (incoming.some((file) => file.size > REPORT_EVIDENCE_MAX_SIZE_BYTES)) {
        showToast(MESSAGE.fileTooLarge, "error");
      }

      const accepted = incoming.filter((file) => file.size <= REPORT_EVIDENCE_MAX_SIZE_BYTES);
      if (accepted.length === 0) return;

      setEvidence((previous) => {
        const room = REPORT_EVIDENCE_MAX_COUNT - previous.length;
        if (room <= 0) {
          showToast(MESSAGE.tooManyImages, "error");
          return previous;
        }

        const added = accepted.slice(0, room).map((file, index) => ({
          id: `${Date.now()}-${index}-${file.name}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        return [...previous, ...added];
      });
    },
    [showToast],
  );

  const removeEvidence = useCallback((id: string) => {
    setEvidence((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return previous.filter((item) => item.id !== id);
    });
  }, []);

  const changeDetail = useCallback((value: string) => {
    setDetail(value.slice(0, REPORT_DETAIL_MAX_LENGTH));
  }, []);

  const submit = useCallback(async (): Promise<ReportResult | null> => {
    if (submitting) return null;

    const trimmedDetail = detail.trim();
    if (reasons.length === 0) {
      showToast(MESSAGE.reasonRequired, "error");
      return null;
    }
    // BE 6003을 왕복하기 전에 먼저 막는다.
    if (detailRequired && !trimmedDetail) {
      showToast(MESSAGE.detailRequired, "error");
      return null;
    }

    setSubmitting(true);
    try {
      // 이미지는 presigned URL 발급 → S3 PUT을 먼저 끝내고 objectKey만 접수에 싣는다.
      let imageKeys: string[] = [];
      try {
        imageKeys = await uploadReportEvidence(evidence.map((item) => item.file));
      } catch (err: unknown) {
        showToast(getApiErrorCode(err) ? toSubmitMessage(err) : MESSAGE.uploadFailed, "error");
        return null;
      }

      const { id } = await createUserReport({
        reportedMemberId,
        reasons,
        reason: reasons[0],
        source,
        detail: trimmedDetail ? trimmedDetail : undefined,
        imageKeys,
        // 신고하면 항상 차단한다(2026-09-27 정책). 서버가 접수와 함께 차단까지 처리한다.
        block: true,
      });

      return { reportId: id, targetNickname };
    } catch (err: unknown) {
      showToast(toSubmitMessage(err), "error");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [
    detail,
    detailRequired,
    evidence,
    reasons,
    reportedMemberId,
    showToast,
    source,
    submitting,
    targetNickname,
  ]);

  return {
    reasons,
    toggleReason,
    detail,
    changeDetail,
    detailRequired,
    evidence,
    addEvidence,
    removeEvidence,
    canSubmit: reasons.length > 0 && !submitting && (!detailRequired || detail.trim().length > 0),
    submitting,
    submit,
  };
}
