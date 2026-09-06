export interface KakaoLoginResult {
  // 이름·전화번호는 더 이상 받지 않는다(2026-09-06). 카카오 동의항목에서 뺐고
  // FE 에도 쓰는 곳이 없다 — 이름은 노출 화면이 없고 전화번호는 본인인증과 함께
  // 사라졌다(2026-08-30).
  profileImage?: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  kakaoId?: number;
  providerUserId?: number | string;
  nickname?: string;
  isRegistered?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface KakaoCallbackResponse extends KakaoLoginResult {
  kakaoId: number | string;
}

interface KakaoAuth {
  authorize(options: {
    redirectUri: string;
  }): void;
}

interface KakaoSdk {
  init(apiKey?: string): void;
  isInitialized(): boolean;
  Auth: KakaoAuth;
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}
