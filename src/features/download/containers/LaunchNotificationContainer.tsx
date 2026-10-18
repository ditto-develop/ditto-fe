"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLaunchNotificationForm } from "@/features/download/hooks/useLaunchNotificationForm";
import { LaunchNotificationCompleteView } from "@/features/download/ui/LaunchNotificationCompleteView";
import { LaunchNotificationFormView } from "@/features/download/ui/LaunchNotificationFormView";

/** Android 출시 알림 신청(/download/android). 입력 → 완료는 같은 라우트의 단계로 다룬다. */
export function LaunchNotificationContainer() {
  const router = useRouter();
  const form = useLaunchNotificationForm();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (await form.submit()) setSubmitted(true);
  };

  if (submitted) {
    return <LaunchNotificationCompleteView onConfirm={() => router.push("/download")} />;
  }

  return (
    <LaunchNotificationFormView
      form={form}
      onBack={() => router.push("/download")}
      // 새 탭으로 연다 — 같은 탭으로 가면 돌아왔을 때 입력한 이메일과 동의가 사라진다.
      onOpenPrivacyPolicy={() => window.open("/settings/privacy/", "_blank", "noopener,noreferrer")}
      onSubmit={handleSubmit}
    />
  );
}
