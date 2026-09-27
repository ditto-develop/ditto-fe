/** BE 계약의 reason code (PR #97). */
export type ReportReason =
  | "inappropriate-behavior"
  | "money-demand"
  | "false-information"
  | "underage"
  | "etc";

/** 신고 진입 화면. 프로필(그룹 멤버 프로필 포함)은 profile, 1:1 채팅 메뉴는 chat-room. */
export type ReportSource = "profile" | "match-result" | "chat-room";

export type ReportReasonOption = {
  value: ReportReason;
  emoji: string;
  label: string;
  description: string;
  /** true면 detail 입력이 필수다(BE code 6003). */
  detailRequired?: boolean;
};

/** 증거 첨부 슬롯. presigned URL 업로드 전까지 로컬 objectURL로 미리보기를 유지한다. */
export type ReportEvidence = {
  id: string;
  file: File;
  previewUrl: string;
};

/** POST /api/v1/user-reports/image-upload-urls */
export type ImageUploadFileRequest = {
  contentType: string;
  /** byte 단위. 파일당 최대 5 MiB. */
  contentLength: number;
};

export type ImageUploadUrl = {
  objectKey: string;
  uploadUrl: string;
};

export type ImageUploadUrlsResponse = {
  uploads: ImageUploadUrl[];
};

/** POST /api/v1/user-reports */
export type CreateUserReportRequest = {
  reportedMemberId: number;
  /** 1개 이상, 중복 없이(BE 위키 Frontend-QA-Fixes-Guide §4). 있으면 서버는 reason 을 무시한다. */
  reasons: ReportReason[];
  /**
   * 단일 사유(구 계약). reasons 를 모르는 서버에 대비해 첫 사유를 함께 싣는다 — BE 가 당분간
   * 계속 받는다고 명시했다. 서버 배포가 끝나면 뺀다.
   */
  reason: ReportReason;
  source: ReportSource;
  detail?: string;
  imageKeys: string[];
  /** BE 필수 필드. 신고는 항상 차단을 동반하므로 FE는 true로 보낸다(2026-09-27 정책). */
  block: boolean;
};

export type CreateUserReportResponse = {
  id: number;
};

/** 신고 완료 화면에 필요한 값. */
export type ReportResult = {
  reportId: number;
  targetNickname: string;
};

export type ReportTarget = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
};
