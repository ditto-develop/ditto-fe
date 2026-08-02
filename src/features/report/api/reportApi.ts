import type {
  CreateUserReportRequest,
  CreateUserReportResponse,
  ImageUploadFileRequest,
  ImageUploadUrlsResponse,
  ReportTarget,
} from "@/features/report/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

type PublicProfile = {
  userId: number;
  nickname: string;
  profileImageUrl?: string;
};

/**
 * 신고 대상의 표시용 정보(닉네임/프로필 이미지).
 * 전용 엔드포인트가 없어 공개 프로필 조회를 재사용한다.
 *
 * profileApi.getUserProfile은 아직 구 prefix(`/api/...`)를 쓰는 generated client 경유라
 * 라이브 BE(`/api/v1`)에 없다. 신규 코드이므로 정본 클라이언트로 직접 호출한다.
 */
export async function getReportTarget(userId: number): Promise<ReportTarget> {
  const profile = await externalApiFetch<PublicProfile>(`/api/v1/users/${userId}/profile`);
  return {
    userId,
    nickname: profile.nickname,
    profileImageUrl: profile.profileImageUrl ?? null,
  };
}

/** 1단계: presigned 업로드 URL 발급. 응답 uploads는 요청 files와 같은 순서다. */
export function issueReportImageUploadUrls(
  files: ImageUploadFileRequest[],
): Promise<ImageUploadUrlsResponse> {
  return externalApiFetch<ImageUploadUrlsResponse>("/api/v1/user-reports/image-upload-urls", {
    method: "POST",
    body: { files },
  });
}

/**
 * 2단계: presigned URL에 원본 파일을 직접 PUT 한다.
 * Authorization / X-API-Key는 붙이지 않으며, Content-Type은 발급 요청과 같아야 한다.
 * URL 유효시간은 10분.
 */
export async function uploadReportImage(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`증거 이미지 업로드 실패 (${response.status})`);
  }
}

/** 3단계: 신고 접수. imageKeys에는 업로드가 끝난 objectKey만 넣는다. */
export function createUserReport(
  body: CreateUserReportRequest,
): Promise<CreateUserReportResponse> {
  return externalApiFetch<CreateUserReportResponse>("/api/v1/user-reports", {
    method: "POST",
    body,
  });
}

/**
 * 발급 → PUT → objectKey 수집을 한 번에 처리한다.
 * 한 장이라도 실패하면 전체를 실패로 본다. 부분 업로드 상태로 접수하면
 * 사용자가 붙인 증거가 조용히 누락되고, BE도 6005로 거절한다.
 */
export async function uploadReportEvidence(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const { uploads } = await issueReportImageUploadUrls(
    files.map((file) => ({ contentType: file.type, contentLength: file.size })),
  );

  await Promise.all(
    uploads.map((upload, index) => uploadReportImage(upload.uploadUrl, files[index])),
  );

  return uploads.map((upload) => upload.objectKey);
}
