export type ControlButtonVariant = "disabled" | "primary" | "secondary" | "tertiary";

export type Introduce = string[]; 

export type FormData = {
  name: string;
  phone: string;
  code: string;
  email: string;

  pic: string;
  nickname: string;
  
  // 성별은 값이 정해져 있다면 유니온 타입으로 좁히는 것을 추천합니다 (선택 사항)
  gender: "man" | "woman" | string | null; 
  age: string | null;
  interest: string[];
  place: string | null;
  job: string | null;
  birthDate: string | null;

  introduce: Introduce; // 또는 string[]

  // ✅ 수정된 부분: any 제거, number 타입 지정, undefined 허용(?)
  kakaoId?: number; 
};

export type OnChange = <K extends keyof FormData>(key: K, value: FormData[K]) => void;
