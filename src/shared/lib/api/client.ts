import { OpenAPI } from "./generated/core/OpenAPI";
import { refreshAccessToken } from "./externalClient";

/** API BASE URL 가져오기 */
export function getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics";
}

/** Token 초기화 */
export function clearToken(): void {
    OpenAPI.TOKEN = undefined;
}

// 토큰 refresh 정본은 externalClient의 single-flight refreshAccessToken.
// (generated client 제거 시 이 래퍼도 함께 사라지고 호출부가 refreshAccessToken으로 이동)
export function tryRefreshToken(): Promise<string | null> {
    return refreshAccessToken();
}
