"use client";

import { useRouter } from "next/navigation";

import { ActionButton, ActionSheet } from "@/components/input/Action";
import { useMatchingNotifyPrompt } from "@/features/settings/hooks/useMatchingNotifyPrompt";

/**
 * 퀴즈 완료 화면 하단의 알림 안내. 서버 매칭 알림이나 OS 알림 권한이 꺼져 있을 때만 뜬다
 * (`resolveNotifyPrompt`). OS 에서 거절한 사람은 버튼이 설정 앱의 디토 알림 화면을 연다.
 *
 * 두 퀴즈 화면(`/quiz/current`, `/quiz/[id]`)의 완료 화면이 같이 쓴다.
 */
export function QuizNotifyPrompt({ defaultCaption }: { defaultCaption: string }) {
  const router = useRouter();
  const { prompt, notifying, enableNotify } = useMatchingNotifyPrompt();

  if (!prompt.show) return null;

  return (
    <ActionSheet caption={prompt.caption ?? defaultCaption} layout="column">
      <ActionButton
        variant={notifying ? "disabled" : "primary"}
        disabled={notifying}
        onClick={() => void enableNotify()}
      >
        {prompt.buttonLabel}
      </ActionButton>
      <ActionButton onClick={() => router.push("/home")} variant="tertiary">
        다음에 하기
      </ActionButton>
    </ActionSheet>
  );
}
