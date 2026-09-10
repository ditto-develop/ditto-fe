import type { LoginMethod, LoginProvider } from "@/shared/lib/analytics/events";

/**
 * 리다이렉트 로그인의 제공자를 콜백까지 들고 간다.
 *
 * 웹(그리고 안드로이드 앱)의 소셜 로그인은 BE → 카카오/애플 → `/auth/callback` 으로
 * 이어지는 리다이렉트다. 그런데 **BE 가 돌려주는 콜백 쿼리에는 provider 가 없다** —
 * accessToken·signupRequired·sanctioned 뿐이다. 그대로 두면 웹 사용자 전원의 로그인
 * 성공이 "제공자 미상"으로 잡혀, 카카오와 애플 중 무엇이 더 잘 전환되는지 영영 알 수 없다.
 *
 * 그래서 버튼을 누른 시점에 적어 두고 콜백에서 꺼낸다. sessionStorage 를 쓰는 이유는
 * 리다이렉트가 같은 탭에서 일어나고, 탭을 닫으면 같이 사라져야 하는 값이기 때문이다.
 * 실패해도 계측만 흐려질 뿐 로그인 자체에는 영향이 없어야 한다.
 */

const STORAGE_KEY = "analytics:loginAttempt";

export interface LoginAttempt {
  provider: LoginProvider;
  method: LoginMethod;
}

/** 로그인 시도를 적어 둔다. 저장에 실패해도 조용히 넘어간다. */
export function rememberLoginAttempt(attempt: LoginAttempt): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // 사파리 프라이빗 모드 등에서 던진다. 계측 때문에 로그인을 막을 수는 없다.
  }
}

/**
 * 적어 둔 시도를 꺼내고 지운다(1회용).
 *
 * 지우지 않으면 다음 세션의 콜백이 지난 시도를 자기 것으로 읽는다.
 */
export function takeLoginAttempt(): LoginAttempt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { provider, method } = parsed as Partial<LoginAttempt>;
    if (provider !== "kakao" && provider !== "apple") return null;
    if (method !== "native" && method !== "redirect") return null;
    return { provider, method };
  } catch {
    return null;
  }
}
