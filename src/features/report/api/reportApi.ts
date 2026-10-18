import type {
  CreateUserReportRequest,
  CreateUserReportResponse,
  ImageUploadFileRequest,
  ImageUploadUrlsResponse,
  ReportTarget,
} from "@/features/report/model/types";
import { getUserProfile } from "@/features/profile/api/profileApi";
import { externalApiFetch } from "@/shared/lib/api/externalClient";
import { putToPresignedUrl, uploadViaPresignedUrls } from "@/shared/lib/api/presignedUpload";

/**
 * 신고 대상의 표시용 정보(닉네임/프로필 이미지).
 * 전용 엔드포인트가 없어 공개 프로필 조회를 재사용한다.
 */
export async function getReportTarget(userId: number): Promise<ReportTarget> {
  const profile = await getUserProfile(String(userId));
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

/** 2단계: presigned URL에 원본 파일을 직접 PUT 한다(`putToPresignedUrl`). */
export function uploadReportImage(uploadUrl: string, file: File): Promise<void> {
  return putToPresignedUrl(uploadUrl, file);
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

/** 발급 → PUT → objectKey 수집. 한 장이라도 실패하면 전체를 실패로 본다(`uploadViaPresignedUrls`). */
export function uploadReportEvidence(files: File[]): Promise<string[]> {
  return uploadViaPresignedUrls(files, issueReportImageUploadUrls);
}
