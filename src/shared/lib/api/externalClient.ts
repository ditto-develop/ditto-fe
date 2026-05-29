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

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export function getExternalApiBase(): string {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_EXTERNAL_API_BASE || "https://api.ditto.pics");
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

export async function externalApiFetch<T>(
    path: string,
    options: ExternalRequestOptions = {},
): Promise<T> {
    const apiKey = process.env.NEXT_PUBLIC_EXTERNAL_API_KEY || "";
    const token = getAccessToken();
    const headers: Record<string, string> = {
        Accept: "application/json",
        ...options.headers,
    };

    if (apiKey) headers["X-API-Key"] = apiKey;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(`${getExternalApiBase()}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const json = (await response.json().catch(() => null)) as ExternalResponse<T> | null;

    if (!response.ok) {
        throw new Error(getErrorMessage(json?.error, `External API ${response.status}: ${path}`));
    }

    if (!json?.success) {
        throw new Error(getErrorMessage(json?.error, `External API error: ${path}`));
    }

    return json.data as T;
}

export function readExternalRefreshToken(): string {
    return getRefreshToken();
}
