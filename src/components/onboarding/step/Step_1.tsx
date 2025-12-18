import { TextField } from "@/components/TextField";
import type { FormData, ControlButtonVariant, OnChange } from "@/types/type";
import { useEffect } from "react";

interface Step1Props {
  data: FormData;
  onChange: OnChange;
  setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
}

export function Step1Identity({ data, onChange, setControlButton }: Step1Props) {
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length < 4) return numbers;
    if (numbers.length < 8) return numbers.replace(/(\d{3})(\d{1,4})/, "$1-$2");
    return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, "$1-$2-$3");
  };

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
}

export function Step1Final({ setControlButton }: Step1Props) {
  useEffect(() => {
    setControlButton("primary");
  }, [setControlButton]);

  return <>인증화면 개발예정</>;
}
