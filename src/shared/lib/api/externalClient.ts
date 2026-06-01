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
};

const REFRESH_PATH = "/api/v1/users/auth/refresh";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export function getExternalApiBase(): string {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics");
}

const getAccessToken = (): string => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") || "";
};

function getRefreshToken(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("refreshToken") || "";
}

function getErrorMessage(error: ExternalResponse<unknown>["error"], fallback: string): string {
    if (!error) return fallback;
    if (typeof error === "string") return error;
    return error.message || error.code || fallback;
}

function clearStoredTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}

// 동시에 여러 401이 발생해도 refresh 요청은 1회만 발생
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshExternalAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return null;
        try {
            const refreshUrl = `${getExternalApiBase()}${REFRESH_PATH}`;
            console.log(`[externalApiFetch] → POST ${refreshUrl} (token refresh)`);
            const res = await fetch(refreshUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
            type RefreshData = { accessToken?: string; refreshToken?: string };
            const json = (await res.json().catch(() => null)) as ExternalResponse<RefreshData> | null;
            console.log(`[externalApiFetch] ← ${res.status} POST ${refreshUrl} (token refresh)`, json);
            const newToken = json?.data?.accessToken;
            if (!res.ok || !json?.success || !newToken) return null;
            localStorage.setItem("accessToken", newToken);
            if (json.data?.refreshToken) localStorage.setItem("refreshToken", json.data.refreshToken);
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
    });

    const json = (await response.json().catch(() => null)) as ExternalResponse<T> | null;

    console.groupCollapsed(`[externalApiFetch] ← ${response.status} ${method} ${url}`);
    console.log("response status:", response.status, response.ok ? "(ok)" : "(error)");
    console.log("response json:", json);
    console.groupEnd();

    if (response.status === 401) {
        const err = new Error(getErrorMessage(json?.error, `External API 401: ${path}`));
        (err as Error & { status: number }).status = 401;
        throw err;
    }

    if (!response.ok) {
        throw new Error(getErrorMessage(json?.error, `External API ${response.status}: ${path}`));
    }

    if (!json?.success) {
        throw new Error(getErrorMessage(json?.error, `External API error: ${path}`));
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
            clearStoredTokens();
            throw err;
        }
        if (status === 401) {
            const newToken = await tryRefreshExternalAccessToken();
            if (newToken) {
                return doFetch<T>(path, options, newToken);
            }
            clearStoredTokens();
        }
        throw err;
    }
}

export function readExternalRefreshToken(): string {
    return getRefreshToken();
}
