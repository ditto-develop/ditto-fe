/** 소셜 로그인에서 받아오는 정보로 회원가입 폼을 채운다. */

"use client";

import {

  useToast

} from "@/context/ToastContext";

import { createExternalUser, saveExternalIntroNote } from "@/shared/lib/api/externalApi";
import { calculateAge, toAgeBucket } from "@/shared/lib/age";
import type { CreateExternalUserBody } from "@/shared/lib/api/externalApi";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";

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

/**
 * 생년월일 문자열을 BE의 LocalDateTime 형식(`yyyy-MM-dd HH:mm:ss`)으로 변환한다.
 * 날짜 입력값의 날짜 부분을 그대로 보존한다.
 */
function toLocalDateTime(birthDate: string): string {
  return `${birthDate.slice(0, 10)} 00:00:00`;
}

/**
 * 외부 성별 표현("MALE"/"male"/"FEMALE"/"female")을 폼 내부 값("man"/"woman")으로 변환한다.
 * 매칭되지 않으면 fallback을 그대로 반환한다.
 */
function toFormGender(gender: string | undefined, fallback: FormData["gender"]): FormData["gender"] {
  const normalized = gender?.toLowerCase();
  if (normalized === "male") return "man";
  if (normalized === "female") return "woman";
  return fallback;
}


/** 소개노트 마지막 문항(Q10, "나를 한 줄로 표현한다면?"). 회원가입 introduction으로 전송된다. */
const LAST_INTRO_NOTE_INDEX = INTRO_NOTE_FIELDS.length - 1;

export function Tutorial({ initialData }: TutorialProps) {
  const { showToast, removeToast } = useToast();
  const router = useRouter();

  // --- State ---
  // ✅ initialData가 존재하면 이미 로그인이 된 상태이므로 Step 1부터 시작
  const [step, setStep] = useState(initialData ? 1 : 0); 
  const [controlButton, setControlButton] = useState<ControlButtonVariant>("disabled");
  // 소개 노트 답변 편집 중에는 하단 CTA를 감춘다 — 키보드 위에 겹쳐 입력 영역이 너무 좁아진다.
  const [editingIntroAnswer, setEditingIntroAnswer] = useState(false);

  // --- Refs ---
  // 본인인증 스텝을 없애 온보딩은 2단계다(2026-08-30). 컴포넌트 파일명(Step_2/Step_3)은
  // 그대로라 ref 이름도 컴포넌트를 따르고, 화면 번호와는 하나씩 어긋난다.
  const step2Ref = useRef<Step2Ref>(null);      // 1단계: 프로필
  const step3Ref = useRef<Step3Ref>(null);      // 2단계: 소개 노트

  // --- Form Data ---
  const [formData, setFormData] = useState<FormData>({
    email: initialData?.email || "",
    pic: initialData?.profileImage || "m1",
    nickname: initialData?.nickname || "",
    gender: toFormGender(initialData?.gender, null),
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
        gender: toFormGender(initialData.gender, prev.gender),
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
        birthDate: loginResult.birthDate || prev.birthDate,
        gender: toFormGender(loginResult.gender, prev.gender),
      }));
      setStep(1);
    }
  };

  // --- 페이지 이동 로직 ---
  const goNextStep = async () => {
    // 1단계(프로필) → 2단계(소개 노트): 단순 페이지 이동
    if (step < 2) {
      setControlButton("disabled");
      setStep((prev) => prev + 1);
    } 
    // 2단계: 최종 회원가입 요청
    else {
      try {
        /*
         * 1. 나이 처리: 생년월일에서 만 나이를 구해 BE 가 받는 연령대 값으로 내린다.
         *
         *    ⚠️ 하한값(20·25·30…)과 중앙값(22·27·32…) 중 무엇을 보낼지는 아직
         *    확정되지 않았다. BE 위키 Frontend-Kakao-General-App-Guide §2 는 중앙값이라고
         *    하고 현재 코드는 하한값을 보낸다 — INTEGRATION-TODO.md §B-6.
         *    (표시용 `formatAgeRange` 는 구간으로 분류하므로 둘 중 어느 쪽이 와도 옳게 나온다.)
         */
        const age = calculateAge(formData.birthDate ?? "");

        // 2. 성별 처리: 백엔드 스펙(MALE/FEMALE)에 맞춰 대문자 변환
        let parsedGender = formData.gender || "";
        if (parsedGender === "man") parsedGender = "MALE";
        if (parsedGender === "woman") parsedGender = "FEMALE";

        /*
         * 3. 가입 필수값 가드.
         *
         * 카카오 일반 앱 전환(BE 위키 Frontend-Kakao-General-App-Guide §2)으로 `gender`·`age`
         * 가 **필수**가 됐다. 없으면 `0001`(400) 이다. 정상 흐름에서는 Step2 검증이 둘 다
         * 보장하지만, 그 검증은 `step2Ref.current` 가 있을 때만 도는 조건부 가드라
         * 참조가 비면 통째로 건너뛴다.
         *
         * 예전에는 그 경우 `age: 0` · `gender: ""` 로 요청이 나갔다. 이제는 서버가 거절하고,
         * 사용자에게는 "회원가입 중 문제가 발생했어요"라는 원인 없는 문구만 보인다.
         * 요청을 보내지 않고 어디를 고쳐야 하는지 말해 주는 편이 낫다.
         */
        if (!parsedGender || age === null) {
          showToast("성별과 생년월일을 입력해주세요.", "error");
          return;
        }

        const parsedAge = toAgeBucket(age);

        // 3. 회원가입 payload 생성 (인증은 Authorization 헤더로 처리되므로 provider 정보는 보내지 않는다)
        const createUserDto: CreateExternalUserBody = {
          nickname: formData.nickname,

          // 전화번호는 수집하지 않는다(2026-08-30). 본인인증을 빼면서 유일한 수집
          // 경로가 사라졌고, 소셜 로그인도 번호를 주지 않는다. 라이브 스펙상 nullable.
          phoneNumber: null,

          // 이름도 수집하지 않는다(2026-09-06). 라이브 스펙상 nullable 이라 아예
          // 싣지 않는다 — 개인정보처리방침의 필수 수집 항목에 없다.

          // 이메일은 Step2 의 필수 입력이다. 그래도 공백만 들어온 경우를 대비해
          // 라이브 스펙상 nullable 인 점을 살려 빈 값은 null 로 보낸다.
          email: formData.email.trim() || null,

          gender: parsedGender,
          age: parsedAge,

          // 생년월일은 LocalDateTime 형식으로 변환, 값이 없으면 null로 전송
          birthDate: formData.birthDate ? toLocalDateTime(formData.birthDate) : null,

          // 프로필 정보(Step2 코드 값). Step2 검증에서 필수 입력이 보장된다.
          interests: formData.interest,
          location: formData.place ?? "",
          job: formData.job ?? "",

          // 사용자가 선택한 아바타(formData.pic: "m1"/"f4" 등)를 svg 경로로 전송한다.
          // 별도 profileImageUrl 필드는 없다 — 이 경로가 프로필 조회의 profileImageUrl로 나간다.
          caricature: `/onboarding/profileimg/avatar/${formData.pic}.svg`,

          // 한 줄 소개. 소개노트 마지막 문항(Q10)의 답변이 그대로 여기로 간다.
          introduction: formData.introduce[LAST_INTRO_NOTE_INDEX]?.trim() || null,
        };

        await createExternalUser(createUserDto);

        // 소개노트는 가입 후 문항별로 저장한다. Q10 도 포함한다 — introduction 으로도
        // 보내지만 소개노트 조회(/intro-notes)는 문항별 저장분만 돌려주므로, 여기서 빠지면
        // 상대 프로필의 필수 노출 문항(Q10)이 비어 보인다.
        // 소개노트 저장이 실패해도 가입 자체는 끝난 상태라 되돌리지 않고 넘어간다.
        await Promise.allSettled(
          INTRO_NOTE_FIELDS
            .map((field, index) => ({ code: field.code, answer: formData.introduce[index]?.trim() ?? "" }))
            .filter(({ answer }) => answer.length > 0)
            .map(({ code, answer }) => saveExternalIntroNote(code, answer)),
        );

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

  const handleNext = () => {
    // ✅ 각 단계별 Ref 검증 로직 분리
    if (step === 1) {
      if (step2Ref.current && !step2Ref.current.handleSubmit()) return;
    } else if (step === 2) {
      if (step3Ref.current && !step3Ref.current.handleSubmit()) return;
    }
    goNextStep();
  };

  const handleSkip = () => {
    if (step === 2) {
      showToast(
        <div>
           <Body2Normal $color="white" style={{ fontSize: "14px" }}>매칭 신청을 위해 프로필이 필요해요.</Body2Normal>
           <Body2Normal $color="white" style={{ fontSize: "14px" }}>나중에 꼭 완료해주세요!</Body2Normal>
        </div>,
        "none",
        {
          id: "confirm-msg",
          actionLabel: "확인",
          actionColor: "var(--color-semantic-inverse-primary)",
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
            totalSteps={2}
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
                <Label1Normal>디토는 만 19세 이상만 참여할 수 있어요.</Label1Normal>
                <Label1Normal>
                  허위 정보를 기재하면 신고당할 수 있어요.
                </Label1Normal>
              </>
            }
          >
            <Step2Profile ref={step2Ref} data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      case 2:
        return (
          <OnboardingLayout
            step={2}
            totalSteps={2}
            title="소개 노트 작성하기"
            buttonText="다 작성했어요"
            variant={controlButton}
            onNext={handleNext}
            subbuttonText="다음에 할래요"
            onSubAction={handleSkip}
            hideActions={editingIntroAnswer}
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
            <Step3Intro
              ref={step3Ref}
              data={formData}
              onChange={handleInputChange}
              setControlButton={setControlButton}
              onEditingChange={setEditingIntroAnswer}
              stickyProgress
            />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderStepContent();
}
