/**
 * API Client configuration
 * 환경변수 기반으로 로컬/프로덕션 자동 분기
 */
import { OpenAPI } from "./generated/core/OpenAPI";

/** API BASE URL 가져오기 */
export function getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_BASE || "https://ditto.pics";
}

/** OpenAPI 클라이언트 BASE를 환경에 맞게 설정 */
export function configureApiClient(): void {
    OpenAPI.BASE = getApiBase();
}

/** Token 설정 */
export function setToken(token: string): void {
    OpenAPI.TOKEN = token;
}

/** Token 초기화 */
export function clearToken(): void {
    OpenAPI.TOKEN = undefined;
}

// Re-export generated types and services for convenience
export { OpenAPI } from "./generated/core/OpenAPI";
