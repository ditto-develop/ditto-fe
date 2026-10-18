"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useFeedbackForm } from "@/features/feedback/hooks/useFeedbackForm";
import { FeedbackCompleteView } from "@/features/feedback/ui/FeedbackCompleteView";
import { FeedbackFormView } from "@/features/feedback/ui/FeedbackFormView";

/**
 * 의견 보내기 플로우(설정 > 정보 > 의견 보내기). 입력 → 완료는 같은 라우트의 단계로 다룬다.
 * 보낸 의견을 다시 조회하는 API가 없어 완료 화면은 접수 직후에만 의미가 있다.
 */
export function FeedbackContainer() {
  const router = useRouter();
  const form = useFeedbackForm();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (await form.submit()) setSubmitted(true);
  };

  if (submitted) {
    return <FeedbackCompleteView onConfirm={() => router.push("/settings")} />;
  }

  return (
    <FeedbackFormView
      form={form}
      onCancel={() => router.push("/settings")}
      onSubmit={handleSubmit}
    />
  );
}
