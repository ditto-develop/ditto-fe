/**
 * 인증 토큰 관리 단일 진입점.
 *
 * - accessToken: API 인증에 사용하는 단기 토큰. 회원가입(signupRequired) 단계에서는
 *   refreshToken 없이 accessToken만 발급될 수 있다.
 * - refreshToken: accessToken 만료 시 갱신에 사용하는 토큰. 기존 회원 로그인에서만 발급된다.
 *
 * refresh 없이 access만 남은 상태는 "회원가입 도중 발급된 임시 토큰"이며, 만료되면
 * 갱신할 수 없는 쓰레기값이 되므로 감시·제거 대상이다.
 */

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

const isBrowser = (): boolean => typeof window !== "undefined";

export function getAccessToken(): string {
    return isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) ?? "" : "";
}

export function getRefreshToken(): string {
    return isBrowser() ? localStorage.getItem(REFRESH_TOKEN_KEY) ?? "" : "";
}

/** accessToken은 항상, refreshToken은 값이 있을 때만 저장한다. */
export function setTokens(accessToken: string, refreshToken?: string | null): void {
    if (!isBrowser() || !accessToken) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

export function clearTokens(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * JWT payload의 exp(초 단위)를 ms로 반환한다.
 * JWT 형식이 아니거나 exp가 없으면 null(만료 판단 불가)을 반환한다.
 */
function getTokenExpiryMs(token: string): number | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(atob(payload)) as { exp?: number };
        return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
}

/** accessToken이 만료됐는지 판단한다. 판단 불가(JWT 아님/exp 없음)면 false. */
export function isAccessTokenExpired(): boolean {
    const expiry = getTokenExpiryMs(getAccessToken());
    if (expiry === null) return false;
    return Date.now() >= expiry;
}

/**
 * 유효 세션 여부. accessToken과 refreshToken이 모두 있어야 로그인으로 인정한다.
 * refresh 없이 access만 있는 회원가입 임시 상태는 로그인으로 보지 않는다.
 */
export function hasValidSession(): boolean {
    return Boolean(getAccessToken()) && Boolean(getRefreshToken());
}

/**
 * 갱신 불가능한 만료 토큰(refresh 없는 만료된 access)을 제거한다.
 * - refreshToken이 있으면 access 만료여도 갱신 가능하므로 유지한다.
 * - refreshToken이 없고 access가 만료됐으면 제거한다.
 * 제거가 일어나면 true를 반환한다.
 */
export function purgeStaleTokens(): boolean {
    if (!isBrowser()) return false;
    if (!getAccessToken()) return false;
    if (getRefreshToken()) return false;
    if (isAccessTokenExpired()) {
        clearTokens();
        return true;
    }
    return false;
}
