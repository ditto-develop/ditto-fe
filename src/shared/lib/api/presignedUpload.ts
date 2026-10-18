/**
 * S3 presigned URL 업로드(신고 증거·의견 스크린샷 공통 계약).
 *
 * 흐름은 셋이다: ① 서버에 업로드 URL 발급 → ② 그 URL로 S3에 직접 PUT → ③ objectKey를 본 요청에 싣는다.
 * ①은 엔드포인트가 기능마다 달라 호출부가 넘기고, ②·③ 준비는 여기서 한다.
 */

/** 업로드 URL 발급 요청의 파일 한 건. */
export type PresignedUploadFileRequest = {
  contentType: string;
  /** byte 단위. 실제 파일 크기와 정확히 같아야 한다 — 다르면 S3가 403을 돌려준다. */
  contentLength: number;
};

export type PresignedUpload = {
  /** 본 요청에 가공 없이 그대로 싣는 값. */
  objectKey: string;
  /** PUT 할 주소. 10분 유효. */
  uploadUrl: string;
};

/** 발급 응답. uploads는 요청 files와 같은 순서다. */
export type PresignedUploadsResponse = {
  uploads: PresignedUpload[];
};

/**
 * presigned URL에 원본 파일을 직접 PUT 한다.
 * Authorization / X-API-Key는 붙이지 않으며(붙이면 S3가 거부한다), Content-Type은 발급 요청과 같아야 한다.
 */
export async function putToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`이미지 업로드 실패 (${response.status})`);
  }
}

/**
 * 발급 → PUT → objectKey 수집을 한 번에 처리한다.
 * 한 장이라도 실패하면 전체를 실패로 본다. 부분 업로드 상태로 접수하면
 * 사용자가 붙인 이미지가 조용히 누락되고, BE도 6005로 거절한다.
 */
export async function uploadViaPresignedUrls(
  files: File[],
  issueUploadUrls: (files: PresignedUploadFileRequest[]) => Promise<PresignedUploadsResponse>,
): Promise<string[]> {
  if (files.length === 0) return [];

  const { uploads } = await issueUploadUrls(
    files.map((file) => ({ contentType: file.type, contentLength: file.size })),
  );

  await Promise.all(uploads.map((upload, index) => putToPresignedUrl(upload.uploadUrl, files[index])));

  return uploads.map((upload) => upload.objectKey);
}
