export interface KakaoLoginResult {
  name?: string;
  profileImage?: string;
  email?: string;
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
