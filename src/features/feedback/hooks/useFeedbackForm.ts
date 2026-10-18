"use client";

import { useCallback, useRef, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { createFeedback, uploadFeedbackScreenshots } from "@/features/feedback/api/feedbackApi";
import { getFeedbackDeviceInfo } from "@/features/feedback/lib/deviceInfo";
import {
  FEEDBACK_CONTENT_MAX_LENGTH,
  FEEDBACK_IMAGE_MAX_COUNT,
  FEEDBACK_IMAGE_MAX_SIZE_BYTES,
} from "@/features/feedback/model/feedbackOptions";
import type { FeedbackType } from "@/features/feedback/model/types";
import type { ImageAttachment } from "@/shared/hooks/useImageAttachments";
import { useImageAttachments } from "@/shared/hooks/useImageAttachments";
import { API_ERROR_CODE, getApiErrorCode } from "@/shared/lib/api/apiError";

const MESSAGE = {
  typeRequired: "의견 유형을 선택해 주세요.",
  contentRequired: "내용을 입력해 주세요.",
  fileTooLarge: "파일 크기는 5MB 이하여야 합니다.",
  tooManyImages: `스크린샷은 최대 ${FEEDBACK_IMAGE_MAX_COUNT}장까지 첨부할 수 있어요.`,
  uploadFailed: "스크린샷을 올리지 못했어요. 다시 시도해 주세요.",
  invalidRequest: "입력 내용을 다시 확인해 주세요.",
  submitFailed: "의견을 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;

/**
 * BE 에러 코드 → 사용자 문구(BE 위키 Frontend-Feedback-Guide §에러).
 * 0001 의 error.message 는 필드별이 아닌 공통 문구라(#312) 화면 문구를 FE 가 정한다.
 * 6006·6007(제재)은 API 레이어가 제재 안내 화면으로 보내므로 여기서 따로 다루지 않는다.
 */
function toSubmitMessage(error: unknown): string {
  switch (getApiErrorCode(error)) {
    case API_ERROR_CODE.INVALID_REQUEST:
      return MESSAGE.invalidRequest;
    case API_ERROR_CODE.REPORT_TOO_MANY_IMAGES:
      return MESSAGE.tooManyImages;
    case API_ERROR_CODE.REPORT_INVALID_IMAGE_KEY:
      return MESSAGE.uploadFailed;
    default:
      return MESSAGE.submitFailed;
  }
}

type UseFeedbackFormResult = {
  type: FeedbackType | null;
  selectType: (type: FeedbackType) => void;
  content: string;
  changeContent: (value: string) => void;
  screenshots: ImageAttachment[];
  addScreenshots: (files: FileList | File[]) => void;
  removeScreenshot: (id: string) => void;
  canSubmit: boolean;
  submitting: boolean;
  /** 접수되면 true. 실패는 토스트로 알리고 false. */
  submit: () => Promise<boolean>;
};

export function useFeedbackForm(): UseFeedbackFormResult {
  const { showToast } = useToast();
  const [type, setType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 같은 렌더 안에서 두 번 눌려도 한 번만 보낸다. 같은 스크린샷으로 연달아 보내면 한쪽이 6005로 실패한다.
  const submittingRef = useRef(false);
  const {
    attachments: screenshots,
    addAttachments: addScreenshots,
    removeAttachment: removeScreenshot,
  } = useImageAttachments({
    maxCount: FEEDBACK_IMAGE_MAX_COUNT,
    maxSizeBytes: FEEDBACK_IMAGE_MAX_SIZE_BYTES,
    tooLargeMessage: MESSAGE.fileTooLarge,
    tooManyMessage: MESSAGE.tooManyImages,
  });

  const changeContent = useCallback((value: string) => {
    setContent(value.slice(0, FEEDBACK_CONTENT_MAX_LENGTH));
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (submittingRef.current) return false;

    const trimmedContent = content.trim();
    if (!type) {
      showToast(MESSAGE.typeRequired, "error");
      return false;
    }
    if (!trimmedContent) {
      showToast(MESSAGE.contentRequired, "error");
      return false;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // 스크린샷은 발급 → S3 PUT 을 먼저 끝내고 objectKey만 접수에 싣는다.
      // 재시도도 매번 새 URL 부터 받으므로 이미 쓴 키를 다시 보내 6005 가 나는 일이 없다.
      let imageKeys: string[] = [];
      try {
        imageKeys = await uploadFeedbackScreenshots(screenshots.map((item) => item.file));
      } catch (err: unknown) {
        showToast(getApiErrorCode(err) ? toSubmitMessage(err) : MESSAGE.uploadFailed, "error");
        return false;
      }

      const deviceInfo = await getFeedbackDeviceInfo();
      await createFeedback({ type, content: trimmedContent, imageKeys, ...deviceInfo });
      return true;
    } catch (err: unknown) {
      showToast(toSubmitMessage(err), "error");
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [content, screenshots, showToast, type]);

  return {
    type,
    selectType: setType,
    content,
    changeContent,
    screenshots,
    addScreenshots,
    removeScreenshot,
    canSubmit: type !== null && content.trim().length > 0 && !submitting,
    submitting,
    submit,
  };
}
