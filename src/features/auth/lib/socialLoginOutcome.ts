import { getExternalCurrentUser } from "@/shared/lib/api/externalApi";
import { clearTokens, setTokens } from "@/shared/lib/auth";
import type { KakaoLoginResult } from "@/types/kakao";

/**
 * 소셜 로그인 결과의 결말 분기.
 *
 * 리다이렉트 로그인(콜백 쿼리)과 앱의 네이티브 로그인(JSON 응답)은 **전달 방식만 다르고
 * 결말은 같다.** 두 경로가 따로 분기하면 한쪽만 고쳐지는 사고가 나므로 여기로 모은다.
 *
 * 원본은 KakaoCallback 의 useEffect 였다. 로직은 그대로 옮겼다.
 */

/** 두 경로가 공통으로 만들어 내는 로그인 결과. */
export type SocialLoginResult = {
  accessToken?: string | null;
  signupRequired?: boolean;
  sanctioned?: boolean;
  sanctionCode?: string | null;
  suspendedUntil?: string | null;
};

export type SocialLoginOutcome =
  /** 제재 회원. /sanction 으로 보낸다. */
  | { kind: "sanctioned"; query: string }
  /** 신규 회원. 회원가입(Tutorial) 으로 보낸다. */
  | { kind: "signup" }
  /** 기존 회원. /home 으로 보낸다. */
  | { kind: "home" };

/**
 * /sanction 이 읽는 쿼리만 추려서 만든다.
 * readSanctionCallback 이 보는 값은 sanctioned/sanctionCode/suspendedUntil 셋뿐이다.
 */
export function buildSanctionQuery(result: SocialLoginResult): string {
  const params = new URLSearchParams({ sanctioned: "true" });
  if (result.sanctionCode) params.set("sanctionCode", result.sanctionCode);
  if (result.suspendedUntil) params.set("suspendedUntil", result.suspendedUntil);
  return params.toString();
}

/**
 * 토큰을 정리·저장하고 다음 화면을 정한다.
 *
 * - 제재 회원은 토큰을 발급받지 못한다. 저장을 시도하지 말고 남은 토큰만 비운다.
 * - accessToken 이 있으면 직전 계정의 잔여 토큰이 섞이지 않도록 먼저 비우고 저장한다.
 * - accessToken 이 없어도(네이티브 경로처럼 이미 저장해 둔 경우) 저장된 토큰은 건드리지 않는다.
 */
export function resolveSocialLogin(result: SocialLoginResult | null | undefined): SocialLoginOutcome {
  /*
   * 응답이 비어 있으면(`data: null`) 여기서 그대로 터진다 —
   * `TypeError: null is not an object (evaluating 'result.sanctioned')`.
   *
   * 그 예외는 호출부의 catch 로 떨어져 "네이티브 교환 실패"로 보고되고, 앱 웹뷰 콘솔에는
   * `{}` 로만 찍혀 **원인을 추적할 수 없다**(2026-09-07 기기 디버깅에서 실제로 겪었다).
   * 서버가 무엇을 주든 로그인 흐름은 예측 가능하게 끝나야 하므로, 빈 응답은 "실패"로
   * 명시해 던진다 — 호출부가 리다이렉트 로그인으로 폴백한다.
   */
  if (!result) {
    throw new Error("소셜 로그인 응답이 비어 있습니다(data: null).");
  }

  if (result.sanctioned) {
    clearTokens();
    return { kind: "sanctioned", query: buildSanctionQuery(result) };
  }

  if (result.accessToken) {
    clearTokens();
    setTokens(result.accessToken);
  }

  return result.signupRequired ? { kind: "signup" } : { kind: "home" };
}

/**
 * 회원가입 폼의 초기값을 카카오 정보 기반 현재 사용자 정보로 채운다.
 * 실패해도 빈 값으로 가입 화면에는 들어갈 수 있어야 하므로 던지지 않는다.
 *
 * 여기서 오는 값은 전부 **프리필일 뿐**이다. 성별·생년월일·이메일 모두 가입 폼의
 * 필수 입력이라, 카카오 동의항목이 좁아 아무것도 안 와도 가입은 그대로 진행된다.
 */
export async function fetchSignupInitialData(): Promise<KakaoLoginResult> {
  try {
    const me = await getExternalCurrentUser();
    return {
      gender: me.gender ?? undefined,
      email: me.email ?? undefined,
      birthDate: me.birthDate ?? undefined,
    };
  } catch (err: unknown) {
    console.error("[socialLogin] /api/v1/users/me 조회 실패:", err);
    return {};
  }
}
