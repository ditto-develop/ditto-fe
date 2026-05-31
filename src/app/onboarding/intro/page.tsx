"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import type { Step3Ref } from "@/components/onboarding/step/Step_3";
import { Step3Intro } from "@/components/onboarding/step/Step_3";
import type { ControlButtonVariant, FormData } from "@/types/type";
import { Label1Normal } from "@/shared/ui";

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

  // BE 작업 대기: GET/PUT /api/v1/users/me/intro-notes 엔드포인트가 api.ditto.pics에 추가될 때까지
  //   - GET: 빈 상태로 시작 (저장된 답변 불러오기 불가)
  //   - PUT: 저장 호출 생략 (router.push만 수행)
  //   엔드포인트 추가 후 externalApi 패턴으로 호출 복구 필요.

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSave = async () => {
    if (!step3Ref.current?.handleSubmit()) return;
    setSaving(true);
    try {
      router.push("/home");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
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
