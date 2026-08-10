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
  reason: ReportReason;
  source: ReportSource;
  detail?: string;
  imageKeys: string[];
  /** '이 사용자 차단하기' 체크박스. BE 필수 필드이며 false면 차단하지 않는다. */
  block: boolean;
};

export type CreateUserReportResponse = {
  id: number;
};

/** 신고 완료 화면에 필요한 값. */
export type ReportResult = {
  reportId: number;
  targetNickname: string;
  /**
   * 사용자가 '이 사용자 차단하기'를 선택했는지.
   * 접수 요청의 block 필드로 함께 전송되어 서버가 차단까지 처리한 상태다.
   */
  blockRequested: boolean;
};

export type ReportTarget = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
};
