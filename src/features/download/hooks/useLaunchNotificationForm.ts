"use client";

import { useCallback, useRef, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { requestLaunchNotification } from "@/features/download/api/launchNotificationApi";
import {
  LAUNCH_NOTIFICATION_EMAIL_MAX_LENGTH,
  isValidEmail,
} from "@/features/download/model/launchNotification";
import { API_ERROR_CODE, getApiErrorCode } from "@/shared/lib/api/apiError";

const MESSAGE = {
  invalidEmail: "이메일 주소를 다시 확인해 주세요.",
  consentRequired: "개인정보 수집·이용에 동의해 주세요.",
  submitFailed: "신청하지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;

type UseLaunchNotificationFormResult = {
  email: string;
  changeEmail: (value: string) => void;
  /** 입력을 마친 뒤(blur) 형식이 틀렸으면 true. 입력 중에는 경고하지 않는다. */
  emailInvalid: boolean;
  touchEmail: () => void;
  consented: boolean;
  setConsented: (value: boolean) => void;
  canSubmit: boolean;
  submitting: boolean;
  /** 접수되면 true. 실패는 토스트로 알리고 false. */
  submit: () => Promise<boolean>;
};

export function useLaunchNotificationForm(): UseLaunchNotificationFormResult {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 같은 렌더 안에서 두 번 눌려도 한 번만 보낸다.
  const submittingRef = useRef(false);

  const changeEmail = useCallback((value: string) => {
    setEmail(value.slice(0, LAUNCH_NOTIFICATION_EMAIL_MAX_LENGTH));
  }, []);

  const touchEmail = useCallback(() => setEmailTouched(true), []);

  const emailValid = isValidEmail(email);

  const submit = useCallback(async (): Promise<boolean> => {
    if (submittingRef.current) return false;
    if (!isValidEmail(email)) {
      setEmailTouched(true);
      showToast(MESSAGE.invalidEmail, "error");
      return false;
    }
    if (!consented) {
      showToast(MESSAGE.consentRequired, "error");
      return false;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await requestLaunchNotification(email);
      return true;
    } catch (err: unknown) {
      // 0001 은 서버의 이메일 형식 판정이 우리보다 엄격할 때다. 남용 방지 제한 등 나머지는 공통 문구로 알린다.
      showToast(
        getApiErrorCode(err) === API_ERROR_CODE.INVALID_REQUEST ? MESSAGE.invalidEmail : MESSAGE.submitFailed,
        "error",
      );
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [consented, email, showToast]);

  return {
    email,
    changeEmail,
    emailInvalid: emailTouched && email.trim().length > 0 && !emailValid,
    touchEmail,
    consented,
    setConsented,
    canSubmit: emailValid && consented && !submitting,
    submitting,
    submit,
  };
}
