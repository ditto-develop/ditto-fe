/**
 * 인증 토큰 관리 단일 진입점.
 *
 * - accessToken: API 인증에 사용하는 단기 토큰. localStorage에 저장된다.
 * - refreshToken: BE가 HttpOnly 쿠키로 관리한다. FE는 읽거나 저장하지 않는다.
 *
 * 401 발생 시 API 클라이언트가 /auth/refresh 를 credentials:'include'로 호출하면
 * BE가 HttpOnly 쿠키의 refreshToken을 읽어 새 accessToken을 응답한다.
 */

export const ACCESS_TOKEN_KEY = "accessToken";

const isBrowser = (): boolean => typeof window !== "undefined";

export function getAccessToken(): string {
    return isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) ?? "" : "";
}

/** accessToken만 저장한다. refreshToken은 BE HttpOnly 쿠키로 관리된다. */
export function setTokens(accessToken: string): void {
    if (!isBrowser() || !accessToken) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
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
 * 유효 세션 여부. accessToken이 있으면 로그인으로 인정한다.
 * refreshToken은 BE HttpOnly 쿠키로 관리되므로 FE에서 확인하지 않는다.
 * accessToken이 만료된 경우에도 true를 반환하며, 401 발생 시 API 클라이언트가 자동 갱신한다.
 */
export function hasValidSession(): boolean {
    return Boolean(getAccessToken());
}
