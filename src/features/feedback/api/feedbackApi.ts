import type {
  CreateFeedbackRequest,
  CreateFeedbackResponse,
} from "@/features/feedback/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";
import type {
  PresignedUploadFileRequest,
  PresignedUploadsResponse,
} from "@/shared/lib/api/presignedUpload";
import { uploadViaPresignedUrls } from "@/shared/lib/api/presignedUpload";

/**
 * 의견 보내기(버그 제보·개선 제안). 계약 정본은 BE 위키 `Frontend-Feedback-Guide` 다.
 * 운영자가 확인만 하고 답하지 않으며, 보낸 의견을 다시 조회하는 API는 없다.
 */

/** 스크린샷 업로드 URL 발급. image/*만, 1~3개, 장당 5MB. 응답 uploads는 요청 files와 같은 순서다. */
export function issueFeedbackImageUploadUrls(
  files: PresignedUploadFileRequest[],
): Promise<PresignedUploadsResponse> {
  return externalApiFetch<PresignedUploadsResponse>("/api/v1/feedbacks/image-upload-urls", {
    method: "POST",
    body: { files },
  });
}

/** 발급 → S3 PUT → objectKey 수집. 한 장이라도 실패하면 전체를 실패로 본다. */
export function uploadFeedbackScreenshots(files: File[]): Promise<string[]> {
  return uploadViaPresignedUrls(files, issueFeedbackImageUploadUrls);
}

/** 의견 접수. imageKeys에는 업로드가 끝난 objectKey만 넣는다. */
export function createFeedback(body: CreateFeedbackRequest): Promise<CreateFeedbackResponse> {
  return externalApiFetch<CreateFeedbackResponse>("/api/v1/feedbacks", {
    method: "POST",
    body,
  });
}
