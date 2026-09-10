import { ApiError, notifySanctionedIfBlocked, notifySignupIncompleteIfBlocked } from "@/shared/lib/api/apiError";
import { clearTokens, getAccessToken, setTokens } from "@/shared/lib/auth";
/*
 * ⚠️ 배럴(`@/shared/lib/analytics`)이 아니라 leaf 모듈을 직접 가져간다.
 * 배럴은 useAnalytics 를 re-export 하고, 그쪽이 features/system → externalApi →
 * 이 파일로 이어져 순환 import 가 된다. 두 leaf 는 의존성이 없어 안전하다.
 */
import { normalizeEndpoint } from "@/shared/lib/analytics/endpointName";
import { trackEvent } from "@/shared/lib/analytics/gtag";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ExternalResponse<T> = {
    success: boolean;
    data?: T | null;
    error?: string | { message?: string; code?: string; statusCode?: number } | null;
};

type ExternalRequestOptions = {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
};

const REFRESH_PATH = "/api/v1/users/auth/refresh";

/**
 * 세션 검증(refresh)의 응답 대기 상한.
 *
 * fetch에는 기본 타임아웃이 없다. 이 요청이 영영 끝나지 않으면 ClientLayout의
 * `isVerifyingSession`이 true로 굳어 **Splash가 화면을 영구히 덮는다** — 사용자에게는
 * "스플래시에서 안 넘어간다"로 보인다. 실패로 떨어뜨려야 로그인 화면이라도 나온다.
 */
const REFRESH_TIMEOUT_MS = 8000;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export function getExternalApiBase(): string {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics");
}

function getErrorMessage(error: ExternalResponse<unknown>["error"], fallback: string): string {
    if (!error) return fallback;
    if (typeof error === "string") return error;
    return error.message || error.code || fallback;
}

function getErrorCode(error: ExternalResponse<unknown>["error"]): string {
    if (!error || typeof error === "string") return "";
    return error.code ?? "";
}

function toApiError(
    json: ExternalResponse<unknown> | null,
    httpStatus: number,
    fallback: string,
): ApiError {
    const code = getErrorCode(json?.error);
    const statusCode =
        json?.error && typeof json.error !== "string" && json.error.statusCode
            ? json.error.statusCode
            : httpStatus;

    notifySanctionedIfBlocked(code);
    notifySignupIncompleteIfBlocked(code);

    return new ApiError(getErrorMessage(json?.error, fallback), code, statusCode);
}

/**
 * 상한을 건 fetch. 시간이 지나면 abort 되어 호출부의 catch로 떨어진다.
 * AbortSignal.timeout은 사파리 지원이 늦어(16+) 직접 컨트롤러를 만든다.
 */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

// 토큰 refresh 정본: 동시에 여러 401이 발생해도 refresh 요청은 1회만 발생(single-flight).
// generated client(client.ts)의 tryRefreshToken도 이 함수로 위임된다.
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshUrl = `${getExternalApiBase()}${REFRESH_PATH}`;
            console.log(`[externalApiFetch] → POST ${refreshUrl} (token refresh)`);
            const apiKey = process.env.NEXT_PUBLIC_DITTO_API_KEY;
            const res = await fetchWithTimeout(refreshUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(apiKey ? { "X-API-Key": apiKey } : {}),
                },
                credentials: "include",
            });
            type RefreshData = { accessToken?: string };
            const json = (await res.json().catch(() => null)) as ExternalResponse<RefreshData> | null;
            console.log(`[externalApiFetch] ← ${res.status} POST ${refreshUrl} (token refresh)`, json);
            const newToken = json?.data?.accessToken;
            if (!res.ok || !json?.success || !newToken) return null;
            setTokens(newToken);
            return newToken;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function doFetch<T>(path: string, options: ExternalRequestOptions, token: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        ...options.headers,
    };
    // 카카오 소셜 로그인(window.location 리다이렉트)을 제외한 모든 API 요청에 X-API-Key를 첨부한다.
    const apiKey = process.env.NEXT_PUBLIC_DITTO_API_KEY;
    if (apiKey) headers["X-API-Key"] = apiKey;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const method = options.method || "GET";
    const url = `${getExternalApiBase()}${path}`;

    console.groupCollapsed(`[externalApiFetch] → ${method} ${url}`);
    console.log("request headers:", headers);
    if (options.body !== undefined) console.log("request body:", options.body);
    console.groupEnd();

    const response = await fetch(url, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        credentials: options.credentials,
    });

    const json = (await response.json().catch(() => null)) as ExternalResponse<T> | null;

    console.groupCollapsed(`[externalApiFetch] ← ${response.status} ${method} ${url}`);
    console.log("response status:", response.status, response.ok ? "(ok)" : "(error)");
    console.log("response json:", json);
    console.groupEnd();

    // 실제 HTTP 401만 토큰 refresh 재시도 대상이다. body의 statusCode는 신뢰하지 않는다.
    if (response.status === 401) {
        throw new ApiError(
            getErrorMessage(json?.error, `External API 401: ${path}`),
            getErrorCode(json?.error),
            401,
        );
    }

    if (!response.ok) {
        throw toApiError(json, response.status, `External API ${response.status}: ${path}`);
    }

    // HTTP 200이어도 컨트롤러 검증/비즈니스 오류는 success:false로 내려온다.
    if (!json?.success) {
        throw toApiError(json, response.status, `External API error: ${path}`);
    }

    return json.data as T;
}

/**
 * 실패를 계측에 남긴다.
 *
 * "이 화면에서 왜 이탈하는가"의 답이 대개 여기 있다. 체류 시간과 퍼널만 보면
 * "흥미를 잃었다"로 읽히는 이탈이, 실은 버튼을 눌렀는데 500 이 떨어진 것이었던
 * 경우가 많다. 화면과 함께 보려고 `screen_name` 대신 전역 파라미터에 기대고,
 * 여기서는 엔드포인트만 남긴다.
 *
 * 응답 본문이나 메시지는 싣지 않는다 — 무엇이 들어올지 모른다.
 */
function reportApiError(path: string, err: unknown): void {
    const typed = err as Error & { status?: number; code?: string };
    trackEvent("api_error", {
        endpoint: normalizeEndpoint(path),
        status: typed?.status ?? 0,
        code: typed?.code ?? "",
    });
}

export async function externalApiFetch<T>(
    path: string,
    options: ExternalRequestOptions = {},
): Promise<T> {
    try {
        return await doFetch<T>(path, options, getAccessToken());
    } catch (err: unknown) {
        const status = (err as Error & { status?: number }).status;
        // refresh 경로 자체가 401이면 재시도 없이 토큰 제거
        if (status === 401 && path === REFRESH_PATH) {
            clearTokens();
            reportApiError(path, err);
            throw err;
        }
        if (status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                /*
                 * refresh 후 재시도가 성공하면 실패로 세지 않는다 — 만료된 토큰을
                 * 갈아 끼우는 건 정상 동작이라, 세면 api_error 가 401 로 뒤덮여
                 * 진짜 문제를 못 찾는다. 재시도까지 실패했을 때만 남긴다.
                 */
                try {
                    return await doFetch<T>(path, options, newToken);
                } catch (retryErr: unknown) {
                    reportApiError(path, retryErr);
                    throw retryErr;
                }
            }
            clearTokens();
        }
        reportApiError(path, err);
        throw err;
    }
}

