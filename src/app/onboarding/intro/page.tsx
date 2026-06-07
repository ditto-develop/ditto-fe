"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import type { Step3Ref } from "@/components/onboarding/step/Step_3";
import { Step3Intro } from "@/components/onboarding/step/Step_3";
import { useToast } from "@/context/ToastContext";
import { getMyIntroNoteAnswersByIndex } from "@/features/profile/api/profileApi";
import type { IntroNoteCode } from "@/features/profile/model/introNotes";
import { saveExternalIntroNote } from "@/shared/lib/api/externalApi";
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

  const [formData, setFormData] = useState<FormData>({
    name: "", phone: "", code: "", email: "", pic: "",
    nickname: "", gender: null, age: null, interest: [],
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

  const handleSave = async () => {
    if (!step3Ref.current?.handleSubmit()) return;
    setSaving(true);
    try {
      router.push("/onboarding/complete");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    router.push("/onboarding/complete");
  };

  if (loading) return null;

  return (
    <OnboardingLayout
      step={3}
      totalSteps={3}
      title="소개 노트 작성하기"
      buttonText="다 작성했어요"
      variant={saving ? "disabled" : controlButton}
      onNext={handleSave}
      onPrev={() => router.push("/home")}
      subbuttonText="다음에 할래요"
      onSubAction={handleSkip}
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
      />
    </OnboardingLayout>
  );
}
