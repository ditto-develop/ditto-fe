export type ControlButtonVariant = "disabled" | "primary" | "secondary" | "tertiary";

export type Introduce = string[]; 

export type FormData = {
  name: string;
  phone: string;
  code: string;

  pic: string;
  nickname: string;
  gender: string | null;
  age: string | null;
  interest: string[];
  place: string | null;
  job: string | null;

  introduce: Introduce;
};

export type OnChange = <K extends keyof FormData>(key: K, value: FormData[K]) => void;
