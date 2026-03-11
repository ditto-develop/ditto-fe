"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IntroNotesService } from "@/lib/api";
import OnboardingLayout from "@/components/onboarding/Onboarding_layout";
import { Step3Intro, Step3Ref } from "@/components/onboarding/step/Step_3";
import { ControlButtonVariant, FormData } from "@/types/type";
import { Label1Normal } from "@/components/common/Text";

const EMPTY_INTRO: FormData["introduce"] = Array.from({ length: 10 }, () => "");

export default function IntroNotePage() {
  const router = useRouter();
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

  // 기존 소개 노트 불러오기
  useEffect(() => {
    IntroNotesService.introNotesControllerGetMyIntroNotes()
      .then((res) => {
        if (res.success && res.data) {
          setFormData((prev) => ({ ...prev, introduce: res.data!.answers }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 작성된 답변을 DB에 저장하는 공통 함수 (부분 저장 허용)
  const saveAnswers = async () => {
    await IntroNotesService.introNotesControllerUpdateMyIntroNotes({
      answers: formData.introduce,
    }).catch(() => {});
  };

  // "다 작성했어요" — 10개 검증 후 저장
  const handleSave = async () => {
    if (!step3Ref.current?.handleSubmit()) return;
    setSaving(true);
    try {
      await saveAnswers();
      router.push("/home");
    } finally {
      setSaving(false);
    }
  };

  // "다음에 할래요" — 현재 입력 중인 내용 포함하여 저장 후 이동
  const handleSkip = async () => {
    const answers = step3Ref.current?.getCurrentValues() ?? formData.introduce;
    await IntroNotesService.introNotesControllerUpdateMyIntroNotes({ answers }).catch(() => {});
    router.push("/home");
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
      />
    </OnboardingLayout>
  );
}
