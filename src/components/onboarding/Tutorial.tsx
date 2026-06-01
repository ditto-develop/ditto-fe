/** 카카오 로그인시 받아오는 정보 miss; */

"use client";

import {

  useToast

} from "@/context/ToastContext";

import type { CreateUserDto } from "@/shared/lib/api/generated";
import { createExternalUser, startExternalSocialLogin } from "@/shared/lib/api/externalApi";

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

  Step1Final,

  Step1Identity

} from "./step/Step_1"; // Step1Final용 타입이 따로 있다면 import 필요

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

export function Tutorial({ initialData }: TutorialProps) {
  const { showToast, removeToast } = useToast();
  const router = useRouter();

  // --- State ---
  // ✅ initialData가 존재하면 이미 로그인이 된 상태이므로 Step 1부터 시작
  const [step, setStep] = useState(initialData ? 1 : 0); 
  const [controlButton, setControlButton] = useState<ControlButtonVariant>("disabled");

  // --- Refs ---
  // ✅ Step별 Ref를 명확히 분리 (Step1Final의 타입이 Step1Ref와 같다면 그대로 써도 되지만, 분리가 안전함)
  const step1Ref = useRef<Step1Ref>(null);      // Step 1: 본인인증 1
  const step1FinalRef = useRef<Step1Ref>(null); // Step 2: 본인인증 2 (타입 확인 필요)
  const step2Ref = useRef<Step2Ref>(null);      // Step 3: 프로필
  const step3Ref = useRef<Step3Ref>(null);      // Step 4: 소개

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
    birthDate: "",
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
    if (step < 4) {
      setControlButton("disabled");
      setStep((prev) => prev + 1);
    } 
    // Step 4: 최종 회원가입 요청
    else {
      try {
        // 1. 나이 처리: "40-45" -> 40 (숫자로 변환)
        const parsedAge = formData.age ? parseInt(formData.age, 10) : 0;

        // 2. 성별 처리: 백엔드 스펙(MALE/FEMALE)에 맞춰 대문자 변환
        let parsedGender = formData.gender || "";
        if (parsedGender === "man") parsedGender = "MALE";
        if (parsedGender === "woman") parsedGender = "FEMALE";

        // 3. DTO 생성
        const createUserDto: CreateUserDto = {
          name: formData.name,
          nickname: formData.nickname,
          phoneNumber: formData.phone,
          
          email: formData.email || "",

          gender: parsedGender,
          age: parsedAge,

          birthDate: formData.birthDate
                ? new Date(formData.birthDate).toISOString()
                : new Date().toISOString(),

          provider: "kakao",
          // 신규 회원은 kakaoId 없이 가입 — 재로그인 시 BE가 실제 kakaoId를 연결
          providerUserId: formData.kakaoId ? String(formData.kakaoId) : "register-user",
        };

        await createExternalUser(createUserDto);

        // BE 작업 대기: 회원가입 직후 토큰을 함께 발급하는 엔드포인트가 없어,
        //   OAuth 흐름을 재시작해 callback에서 토큰을 받아온다.
        //   (카카오 세션이 살아있으면 추가 인증 없이 즉시 callback으로 돌아옴)
        // BE 작업 대기: 아래 프로필/소개노트 PATCH·PUT 엔드포인트 추가 후 저장 복구 필요
        //   - profileImageUrl: `/assets/avatar/${formData.pic}.png`
        //   - location, occupation, interests, introduce
        showToast("회원가입이 완료되었습니다!", "success");
        startExternalSocialLogin("KAKAO");
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
      // Step1Final용 ref 사용
      if (step1FinalRef.current && !step1FinalRef.current.handleSubmit()) return;
    } else if (step === 3) {
      if (step2Ref.current && !step2Ref.current.handleSubmit()) return;
    } else if (step === 4) {
      if (step3Ref.current && !step3Ref.current.handleSubmit()) return;
    }
    goNextStep();
  };

  const handleSkip = () => {
    if (step === 4) {
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
            step={1}
            totalSteps={3}
            title={
              <>
                안전한 대화를 위해
                <br />
                본인 인증이 필요해요
              </>
            }
            buttonText="인증했어요"
            variant={controlButton}
            onNext={handleNext}
            onPrev={goPrevStep}
            description={
              <Label1Normal>
                안전한 이용을 위해 최초 1회 본인인증이 필요해요.
              </Label1Normal>
            }
          >
            {/* ✅ Step1Final에는 step1FinalRef 연결 */}
            <Step1Final ref={step1FinalRef} data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      case 3:
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
      case 4:
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
