import { TextField } from "@/components/input/TextField";
import type { FormData, ControlButtonVariant, OnChange } from "@/types/type";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";

// ✅ 부모에서 사용할 Ref 타입 정의
export interface Step1Ref {
  handleSubmit: () => boolean;
}

interface Step1Props {
  data: FormData;
  onChange: OnChange;
  setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
}

// ----------------------------------------------------------------------
// 1. Step1Identity (본인 인증 정보 입력)
// ----------------------------------------------------------------------
export const Step1Identity = forwardRef<Step1Ref, Step1Props>(({ data, onChange, setControlButton }, ref) => {
  
  // 1. 휴대폰 번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) return numbers.replace(/(\d{3})(\d{1,4})/, "$1-$2");
    return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, "$1-$2-$3");
  };

  // 2. 부모에게 노출할 함수 (handleSubmit)
  useImperativeHandle(ref, () => ({
    handleSubmit: () => {
      // (1) 유효성 검사 로직
      // 예: 이름, 번호, 코드가 비어있는지 확인
      const isValid = !!data.name && !!data.phone && !!data.code;
      
      if (!isValid) {
        // 필요하다면 여기서 에러 토스트를 띄우거나 포커스를 줄 수 있습니다.
        console.log("필수 입력값을 확인해주세요.");
        return false; // 다음 단계로 이동 불가
      }

      // (2) 인증번호 확인 API 호출 로직이 있다면 여기서 수행 (async 필요 시 변경)
      // const isVerified = await verifyCode(data.code); ...
      
      return true; // 성공 시 true 반환
    }
  }));

  // 3. 버튼 상태 (시각적 피드백용)
  useEffect(() => {
    const ok = !!data.name && !!data.phone && !!data.code;
    setControlButton(ok ? "primary" : "disabled");
  }, [data.name, data.phone, data.code, setControlButton]);

  return (
    <>
      <TextField
        label="이름"
        placeholder="이름"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <TextField
        label="휴대폰 번호"
        placeholder="010-0000-0000"
        value={data.phone}
        onChange={(e) => onChange("phone", formatPhoneNumber(e.target.value))}
      />
      <TextField
        label="인증번호"
        placeholder="인증번호를 입력해주세요."
        value={data.code}
        onChange={(e) => onChange("code", e.target.value)}
      />
    </>
  );
});
Step1Identity.displayName = "Step1Identity";


// ----------------------------------------------------------------------
// 2. Step1Final (인증 완료 화면 / 개발 예정)
// ----------------------------------------------------------------------
export const Step1Final = forwardRef<Step1Ref, Step1Props>(({ setControlButton }, ref) => {
  
  // 현재는 특별한 로직이 없으므로 무조건 통과하도록 설정
  useImperativeHandle(ref, () => ({
    handleSubmit: () => {
      console.log("인증 완료 화면 확인");
      return true;
    }
  }));

  useEffect(() => {
    setControlButton("primary");
  }, [setControlButton]);

  return <>인증화면 개발예정</>;
});
Step1Final.displayName = "Step1Final";