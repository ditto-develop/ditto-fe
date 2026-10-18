"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/context/ToastContext";

/** 첨부 슬롯. presigned URL 업로드 전까지 로컬 objectURL로 미리보기를 유지한다. */
export type ImageAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

type UseImageAttachmentsOptions = {
  maxCount: number;
  /** 파일 1건당 최대 크기(byte). */
  maxSizeBytes: number;
  /** 크기 초과 파일을 골랐을 때의 토스트 문구. */
  tooLargeMessage: string;
  /** 이미 maxCount 장인데 더 골랐을 때의 토스트 문구. */
  tooManyMessage: string;
};

type UseImageAttachmentsResult = {
  attachments: ImageAttachment[];
  addAttachments: (files: FileList | File[]) => void;
  removeAttachment: (id: string) => void;
};

/**
 * 이미지 첨부 목록(신고 증거·의견 스크린샷). 개수·크기 제한을 지키고 미리보기 URL을 관리한다.
 *
 * 크기를 넘는 파일만 빼고 나머지는 받는다. 자리가 모자라면 고른 순서대로 남는 자리만큼만 담는다.
 */
export function useImageAttachments({
  maxCount,
  maxSizeBytes,
  tooLargeMessage,
  tooManyMessage,
}: UseImageAttachmentsOptions): UseImageAttachmentsResult {
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);

  // 언마운트 시 objectURL 해제. attachments를 의존성에 넣으면 파일을 지울 때마다
  // 살아있는 URL까지 revoke되므로 ref로 최신 목록만 들고 있는다.
  const attachmentsRef = useRef<ImageAttachment[]>([]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(
    () => () => {
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  const addAttachments = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      if (incoming.some((file) => file.size > maxSizeBytes)) {
        showToast(tooLargeMessage, "error");
      }

      const accepted = incoming.filter((file) => file.size <= maxSizeBytes);
      if (accepted.length === 0) return;

      setAttachments((previous) => {
        const room = maxCount - previous.length;
        if (room <= 0) {
          showToast(tooManyMessage, "error");
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
    [maxCount, maxSizeBytes, showToast, tooLargeMessage, tooManyMessage],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return previous.filter((item) => item.id !== id);
    });
  }, []);

  return { attachments, addAttachments, removeAttachment };
}
