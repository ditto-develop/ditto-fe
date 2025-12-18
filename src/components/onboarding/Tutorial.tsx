"use client";
import { useState } from "react";
import { Label1Normal } from "@/styled/Text";
import OnboardingLayout from "./Onboarding_layout";
import {Step1Final, Step1Identity} from "./step/Step_1";
import {Step2Profile} from "./step/Step_2";
import { Step3Intro } from "./step/Step_3";
import { ControlButtonVariant, OnChange, FormData } from "@/types/type";



export default function Tutorial() {
  const [step, setStep] = useState(1);
  const [controlButton, setControlButton] =
    useState<ControlButtonVariant>("disabled");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    code: "",

    pic: "m1",
    nickname: "",
    gender: null, 
    age: null,     
    interest: [],
    place: null,   
    job: null,     

    introduce: Array.from({ length: 10 }, () => "")
  });

  const handleInputChange: OnChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    setControlButton("disabled");
    setStep((prev) => prev + 1);
  };

  // 단계별 UI 설정 (Switch Case 활용)
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <OnboardingLayout
            step={1}
            totalSteps={3}
            title="간편하게 인증하기"
            buttonText="인증했어요"
            variant={controlButton}
            onNext={handleNext}
            description={
              <>
                <Label1Normal>안전한 이용을 위해 최초 1회 본인인증이 필요해요.</Label1Normal>
                <Label1Normal>디토는 19세 이상만 참여할 수 있어요.</Label1Normal>
              </>
            }
          >
            <Step1Identity data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      case 2:
        return (
          <OnboardingLayout
             step={1}
             totalSteps={3}
             title={<>안전한 대화를 위해<br />본인 인증이 필요해요</>}
             buttonText="인증했어요"
            variant={controlButton}
             onNext={handleNext}
             description={<Label1Normal>안전한 이용을 위해 최초 1회 본인인증이 필요해요.</Label1Normal>}
          >
             {/* 1-2단계 컴포넌트 */}
            <Step1Final data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
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
              description={<><Label1Normal>나랑 같은 답을 한 사람에게만 정보가 공개돼요.</Label1Normal><Label1Normal>허위 정보를 기재하면 신고당할 수 있어요.</Label1Normal></>}
            >
              {/* 2단계 컴포넌트 */}
              <Step2Profile data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
            </OnboardingLayout>
          );
      case 4:
        return (
          <OnboardingLayout
              step={3}
              totalSteps={3}
              title="소개 노트 작성하기"
              subbuttonText="다음에 할래요"
              buttonText="다음"
              onNext={handleNext}
              description={<><Label1Normal>대화 상대에게만 공개되는 나만의 소개 노트예요.</Label1Normal><Label1Normal>작성한 내용이 많을 수록 더 진솔하게 다가갈 수 있어요.</Label1Normal></>}
          >
              {/* 3단계 컴포넌트 */}
            <Step3Intro data={formData} onChange={handleInputChange} setControlButton={setControlButton} />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderStepContent();
}