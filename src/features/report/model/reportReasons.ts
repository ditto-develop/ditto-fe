import type { ReportReasonOption } from "@/features/report/model/types";

/**
 * Figma 7.1 신고/차단 [2441:30585]의 사유 목록(순서 고정).
 * value는 BE reason code(PR #97)와 1:1로 대응한다.
 */
export const REPORT_REASONS: ReportReasonOption[] = [
  {
    value: "inappropriate-behavior",
    emoji: "🚫",
    label: "부적절한 행동",
    description: "성희롱, 폭언, 협박 등",
  },
  {
    value: "money-demand",
    emoji: "💰",
    label: "금전 요구",
    description: "돈을 요구하거나 상업적 홍보",
  },
  {
    value: "false-information",
    emoji: "👻",
    label: "허위 정보",
    description: "프로필 정보가 거짓이거나 사진 도용",
  },
  {
    value: "underage",
    emoji: "🔞",
    label: "미성년자",
    description: "19세 미만으로 의심됨",
  },
  {
    value: "etc",
    emoji: "❗️",
    label: "기타",
    description: "사유 직접 입력",
    detailRequired: true,
  },
];

/** 상세 설명 최대 길이. Figma의 `0/500` 카운터 및 BE maxLength=500 기준. */
export const REPORT_DETAIL_MAX_LENGTH = 500;

/** 증거 첨부 최대 개수. Figma의 `0/3` 카운터 및 BE maxItems=3 기준. */
export const REPORT_EVIDENCE_MAX_COUNT = 3;

/** 증거 파일 1건당 최대 크기(5 MiB). BE contentLength maximum과 동일. */
export const REPORT_EVIDENCE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
