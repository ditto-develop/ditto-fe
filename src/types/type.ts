export type ControlButtonVariant = "disabled" | "primary" | "secondary" | "tertiary";

export type Introduce = string[]; 

export type FormData = {
  // 이름은 수집하지 않는다(2026-09-06). 개인정보처리방침의 필수 수집 항목에 없고
  // 화면에 노출되는 곳도 없어(프로필은 전부 닉네임) 카카오 동의항목에서 뺐다.
  // 이메일은 방침상 필수 항목이라 여기서 직접 입력받는다 — 카카오 이메일 동의는
  // 비즈앱 검수 대상이라 못 받을 수 있다.
  email: string;

  pic: string;
  nickname: string;
  
  // 성별은 값이 정해져 있다면 유니온 타입으로 좁히는 것을 추천합니다 (선택 사항)
  gender: "man" | "woman" | string | null; 
  // 나이는 별도 필드로 두지 않는다 — birthDate 에서 계산한다(@/shared/lib/age).
  interest: string[];
  place: string | null;
  job: string | null;
  birthDate: string | null;

  introduce: Introduce; // 또는 string[]

  // ✅ 수정된 부분: any 제거, number 타입 지정, undefined 허용(?)
  kakaoId?: number; 
};

export type OnChange = <K extends keyof FormData>(key: K, value: FormData[K]) => void;
