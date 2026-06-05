/** 카카오 로그인시 받아오는 정보 miss; */

"use client";

import {

  useToast

} from "@/context/ToastContext";

import { createExternalUser } from "@/shared/lib/api/externalApi";
import type { CreateExternalUserBody } from "@/shared/lib/api/externalApi";

import type {

  ControlButtonVariant,

  FormData,

  OnChange

} from "@/types/type";
import type { KakaoLoginResult } from "@/types/kakao";

import {

  useRouter

} from "next/navigation";

import {

  useEffect,

  useRef,

  useState

} from "react";

import {

  Body2Normal,

  Label1Normal

} from "@/shared/ui";

import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";



import {

  Step0

} from "@/components/onboarding/step/Step0";



import type {

  Step1Ref

} from "./step/Step_1";
import {

  Step1Identity

} from "./step/Step_1";

import type {

  Step2Ref

} from "./step/Step_2";
import {

  Step2Profile

} from "./step/Step_2";

import type {

  Step3Ref

} from "./step/Step_3";
import {

  Step3Intro

} from "./step/Step_3";

interface TutorialProps {
  initialData?: KakaoLoginResult;
}

/** "25-29" → 27, "40-45" → 43, "60+" → 60 처럼 나이 범위 문자열을 중앙값 정수로 변환한다. */
function parseAgeMedian(age: string | null): number {
  if (!age) return 0;
  const range = age.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    return Math.round((Number(range[1]) + Number(range[2])) / 2);
  }
  const open = age.match(/^(\d+)\+?$/);
  return open ? Number(open[1]) : 0;
}

/**
 * 생년월일 문자열을 BE의 LocalDateTime 형식(`YYYY-MM-DDTHH:mm:ss`)으로 변환한다.
 * toISOString()의 밀리초·`Z`(오프셋) 접미사는 LocalDateTime 파싱에 실패하므로 잘라낸다.
 */
function toLocalDateTime(birthDate: string): string {
  return new Date(birthDate).toISOString().slice(0, 19);
}

export function Tutorial({ initialData }: TutorialProps) {
  const { showToast, removeToast } = useToast();
  const router = useRouter();

  // --- State ---
  // ✅ initialData가 존재하면 이미 로그인이 된 상태이므로 Step 1부터 시작
  const [step, setStep] = useState(initialData ? 1 : 0); 
  const [controlButton, setControlButton] = useState<ControlButtonVariant>("disabled");

  // --- Refs ---
  const step1Ref = useRef<Step1Ref>(null);      // Step 1: 본인인증 1
  const step2Ref = useRef<Step2Ref>(null);      // Step 2: 프로필
  const step3Ref = useRef<Step3Ref>(null);      // Step 3: 소개

  // --- Form Data ---
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    phone: "",
    code: "",
    email: initialData?.email || "",
    pic: initialData?.profileImage || "m1",
    nickname: initialData?.nickname || "",
    gender: initialData?.gender === "male" ? "man" : initialData?.gender === "female" ? "woman" : null,
    age: null,
    interest: [],
    birthDate: initialData?.birthDate || "",
    place: null,
    job: null,
    introduce: Array.from({ length: 10 }, () => ""),
    kakaoId: initialData?.kakaoId || undefined,
  });

  const handleInputChange: OnChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ initialData가 변경될 때 formData를 업데이트
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        email: initialData.email || prev.email,
        birthDate: initialData.birthDate || prev.birthDate,
        pic: initialData.profileImage || prev.pic,
        nickname: initialData.nickname || prev.nickname,
        gender: initialData.gender === "male" ? "man" : initialData.gender === "female" ? "woman" : prev.gender,
        kakaoId: initialData.kakaoId || prev.kakaoId,
      }));
    }
  }, [initialData]);

  // ✅ 기존 회원 체크 로직 (Tutorial 마운트 시 실행)
  useEffect(() => {
    if (initialData?.isRegistered) {
      router.push("/home");
    }
  }, [initialData, router]);

  // --- Step 0에서 로그인 완료 시 호출되는 핸들러 ---
  const handleLoginComplete = (loginResult: KakaoLoginResult) => {
    if (loginResult.isRegistered) {
      router.push("/home");
    } else {
      setFormData((prev) => ({
        ...prev,
        kakaoId: loginResult.kakaoId,
        nickname: loginResult.nickname || prev.nickname,
        pic: loginResult.profileImage || prev.pic,
        email: loginResult.email || prev.email,
        gender: loginResult.gender === "male" ? "man" : loginResult.gender === "female" ? "woman" : null,
      }));
      setStep(1);
    }
  };

  // --- 페이지 이동 로직 ---
  const goNextStep = async () => {
    // Step 1~3: 단순 페이지 이동
    if (step < 3) {
      setControlButton("disabled");
      setStep((prev) => prev + 1);
    } 
    // Step 3: 최종 회원가입 요청
    else {
      try {
        // 1. 나이 처리: "25-29" 같은 범위 문자열을 중앙값 정수로 변환
        const parsedAge = parseAgeMedian(formData.age);

        // 2. 성별 처리: 백엔드 스펙(MALE/FEMALE)에 맞춰 대문자 변환
        let parsedGender = formData.gender || "";
        if (parsedGender === "man") parsedGender = "MALE";
        if (parsedGender === "woman") parsedGender = "FEMALE";

        // 3. 회원가입 payload 생성 (인증은 Authorization 헤더로 처리되므로 provider 정보는 보내지 않는다)
        const createUserDto: CreateExternalUserBody = {
          name: formData.name,
          nickname: formData.nickname,

          // BE는 "010-1234-5678" 형태(하이픈 2개)를 검증한다. Step1의 포맷 결과를 그대로 전송.
          phoneNumber: formData.phone,

          // 이메일은 유효한 문자열만 보내고, 비어 있으면 null로 전송
          email: formData.email.trim() || null,

          gender: parsedGender,
          age: parsedAge,

          // 생년월일은 LocalDateTime 형식으로 변환, 값이 없으면 null로 전송
          birthDate: formData.birthDate ? toLocalDateTime(formData.birthDate) : null,
        };

        console.log("[Tutorial] 회원가입 요청 payload →", createUserDto);

        await createExternalUser(createUserDto);

        // TODO(소개노트): BE 엔드포인트 추가 후 프로필/소개노트 저장 복구 필요
        //   - profileImageUrl: `/assets/avatar/${formData.pic}.png`
        //   - location, occupation, interests, introduce
        router.push("/onboarding/complete");
      } catch (error) {
        console.error("Signup failed:", error);
        // 에러 메시지를 사용자에게 보여줄 때, 너무 기술적인 내용보다는 부드럽게 표현
        showToast("회원가입 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.", "error");
      }
    }
  };
  const goPrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    router.push('/home');
  };

  const handleNext = () => {
    // ✅ 각 단계별 Ref 검증 로직 분리
    if (step === 1) {
      if (step1Ref.current && !step1Ref.current.handleSubmit()) return;
    } else if (step === 2) {
      if (step2Ref.current && !step2Ref.current.handleSubmit()) return;
    } else if (step === 3) {
      if (step3Ref.current && !step3Ref.current.handleSubmit()) return;
    }
    goNextStep();
  };

  const handleSkip = () => {
    if (step === 3) {
      showToast(
        <div>
           <Body2Normal $color="white" style={{ fontSize: "14px" }}>매칭 신청을 위해 프로필이 필요해요.</Body2Normal>
           <Body2Normal $color="white" style={{ fontSize: "14px" }}>나중에 꼭 완료해주세요!</Body2Normal>
        </div>,
        "default", 
        {
          id: "confirm-msg",
          actionLabel: "확인",
          onAction: () => {
            removeToast("confirm-msg");
            goNextStep();
          },
          duration: 5000
        }
      );
    }
  };

  // --- Render ---
  const renderStepContent = () => {
    // 기존 회원이면 렌더링 하지 않음 (useEffect에서 리다이렉트)
    if (initialData?.isRegistered) return null;

    switch (step) {
      case 0:
        return <Step0 onLoginComplete={handleLoginComplete} />;
      case 1:
        return (
          <OnboardingLayout
            step={1}
            totalSteps={3}
            title="간편하게 인증하기"
            buttonText="인증했어요"
            variant={controlButton}
            onNext={handleNext}
            onPrev={goPrevStep}
            description={
              <>
                <Label1Normal>
                  안전한 이용을 위해 최초 1회 본인인증이 필요해요.
                </Label1Normal>
                <Label1Normal>디토는 19세 이상만 참여할 수 있어요.</Label1Normal>
              </>
            }
          >
            <Step1Identity ref={step1Ref} data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      case 2:
        return (
          <OnboardingLayout
            step={2}
            totalSteps={3}
            title="프로필 작성하기"
            variant={controlButton}
            buttonText="다음"
            onNext={handleNext}
            onPrev={goPrevStep}
            description={
              <>
                <Label1Normal>
                  나랑 같은 답을 한 사람에게만 정보가 공개돼요.
                </Label1Normal>
                <Label1Normal>
                  허위 정보를 기재하면 신고당할 수 있어요.
                </Label1Normal>
              </>
            }
          >
            <Step2Profile ref={step2Ref} data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      case 3:
        return (
          <OnboardingLayout
            step={3}
            totalSteps={3}
            title="소개 노트 작성하기"
            buttonText="다 작성했어요"
            variant={controlButton}
            onNext={handleNext}
            subbuttonText="다음에 할래요"
            onSubAction={handleSkip}
            onPrev={goPrevStep}
            description={
              <>
                <Label1Normal>
                  대화 상대에게만 공개되는 나만의 소개 노트예요.
                </Label1Normal>
                <Label1Normal>
                  작성한 내용이 많을 수록 더 진솔하게 다가갈 수 있어요.
                </Label1Normal>
              </>
            }
          >
            <Step3Intro ref={step3Ref} data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderStepContent();
}
