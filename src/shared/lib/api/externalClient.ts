import { ApiError, notifySanctionedIfBlocked } from "@/shared/lib/api/apiError";
import { clearTokens, getAccessToken, setTokens } from "@/shared/lib/auth";

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

    return new ApiError(getErrorMessage(json?.error, fallback), code, statusCode);
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
            const res = await fetch(refreshUrl, {
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
            throw err;
        }
        if (status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                return doFetch<T>(path, options, newToken);
            }
            clearTokens();
        }
        throw err;
    }
}

