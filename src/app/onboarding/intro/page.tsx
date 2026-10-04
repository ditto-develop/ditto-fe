"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import type { Step3Ref } from "@/components/onboarding/step/Step_3";
import { Step3Intro } from "@/components/onboarding/step/Step_3";
import { useToast } from "@/context/ToastContext";
import { getMyIntroNoteAnswersByIndex } from "@/features/profile/api/profileApi";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";
import type { IntroNoteCode } from "@/features/profile/model/introNotes";
import { saveExternalIntroNote } from "@/shared/lib/api/externalApi";
import { goBackOr } from "@/shared/lib/navigation";
import { Label1Normal } from "@/shared/ui";
import type { ControlButtonVariant, FormData } from "@/types/type";

const EMPTY_INTRO: FormData["introduce"] = Array.from({ length: 10 }, () => "");

export default function IntroNotePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const step3Ref = useRef<Step3Ref>(null);
  const [controlButton, setControlButton] = useState<ControlButtonVariant>("disabled");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // 답변 편집 중에는 하단 CTA를 감춘다 — 키보드 위에 겹쳐 입력 영역이 너무 좁아진다.
  const [editingAnswer, setEditingAnswer] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: "", pic: "",
    nickname: "", gender: null, interest: [],
    birthDate: "", place: null, job: null,
    introduce: EMPTY_INTRO,
    kakaoId: undefined,
  });

  useEffect(() => {
    let ignore = false;

    const loadIntroNotes = async () => {
      try {
        const introduce = await getMyIntroNoteAnswersByIndex();
        if (!ignore) {
          setFormData((prev) => ({ ...prev, introduce }));
        }
      } catch {
        if (!ignore) {
          setFormData((prev) => ({ ...prev, introduce: EMPTY_INTRO }));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadIntroNotes();

    return () => {
      ignore = true;
    };
  }, []);

  const handlePersistAnswer = async (code: IntroNoteCode, value: string) => {
    try {
      await saveExternalIntroNote(code, value);
    } catch {
      showToast("저장에 실패했어요. 다시 시도해 주세요.", "error");
    }
  };

  /**
   * 검증은 입력창에 떠 있는 값(질문별 저장을 아직 누르지 않은 답 포함)으로 통과시키므로,
   * 그 값 중 서버에 아직 없는 답을 여기서 마저 저장한다. 안 하면 Q10 을 쓰고 질문 저장을
   * 누르지 않은 채 완료했을 때 Q10 이 빈 채로 남는다.
   */
  const handleSave = async () => {
    const step3 = step3Ref.current;
    if (saving || !step3?.handleSubmit()) return;
    setSaving(true);
    try {
      const values = step3.getCurrentValues();
      await Promise.all(
        INTRO_NOTE_FIELDS.map((field, index) => {
          const value = values[index]?.trim() ?? "";
          if (value === (formData.introduce[index]?.trim() ?? "")) return undefined;
          return saveExternalIntroNote(field.code, value);
        }),
      );
      router.push("/onboarding/complete");
    } catch {
      showToast("저장에 실패했어요. 다시 시도해 주세요.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    router.push("/onboarding/complete?introSkipped=1");
  };

  if (loading) return null;

  return (
    <OnboardingLayout
      step={2}
      totalSteps={2}
      title="소개 노트 작성하기"
      buttonText="다 작성했어요"
      variant={saving ? "disabled" : controlButton}
      onNext={handleSave}
      onPrev={() => goBackOr(router, "/home")}
      subbuttonText="다음에 할래요"
      onSubAction={handleSkip}
      hideActions={editingAnswer}
      description={
        <>
          <Label1Normal>대화 상대에게만 공개되는 나만의 소개 노트예요.</Label1Normal>
          <Label1Normal>작성한 내용이 많을 수록 더 진솔하게 다가갈 수 있어요.</Label1Normal>
        </>
      }
    >
      <Step3Intro
        ref={step3Ref}
        data={formData}
        onChange={(key, value) =>
          setFormData((prev) => ({ ...prev, [key]: value }))
        }
        setControlButton={setControlButton}
        onPersist={handlePersistAnswer}
        onEditingChange={setEditingAnswer}
        stickyProgress
      />
    </OnboardingLayout>
  );
}
