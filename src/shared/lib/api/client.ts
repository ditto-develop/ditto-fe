import { ApiError as GeneratedApiError } from "./generated/core/ApiError";
import type { ApiRequestOptions } from "./generated/core/ApiRequestOptions";
import { OpenAPI, type OpenAPIConfig } from "./generated/core/OpenAPI";
import { request } from "./generated/core/request";
import { refreshAccessToken } from "./externalClient";
import { getAccessToken } from "@/shared/lib/auth";

/** API BASE URL 가져오기 */
export function getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics";
}

const apiConfig: OpenAPIConfig = {
    ...OpenAPI,
    BASE: `${getApiBase()}/api`,
    WITH_CREDENTIALS: false,
    CREDENTIALS: "include",
    TOKEN: async () => getAccessToken(),
};

/** Token 초기화 */
export function clearToken(): void {
    OpenAPI.TOKEN = undefined;
}

// 토큰 refresh 정본은 externalClient의 single-flight refreshAccessToken.
// (generated client 제거 시 이 래퍼도 함께 사라지고 호출부가 refreshAccessToken으로 이동)
export function tryRefreshToken(): Promise<string | null> {
    return refreshAccessToken();
}

const normalizeHeaders = (headers: RequestInit["headers"]): Record<string, string> => {
    if (!headers) return {};
    if (headers instanceof Headers) return Object.fromEntries(headers.entries());
    if (Array.isArray(headers)) return Object.fromEntries(headers);
    return headers as Record<string, string>;
};

type MutableApiRequestOptions = {
    -readonly [Key in keyof ApiRequestOptions]: ApiRequestOptions[Key];
};

const toRequestOptions = (path: string, options: RequestInit): ApiRequestOptions => {
    const headers = normalizeHeaders(options.headers);
    const method = (options.method ?? "GET").toUpperCase() as ApiRequestOptions["method"];
    const body = options.body;
    const requestOptions: MutableApiRequestOptions = {
        method,
        url: path,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };

    if (body !== undefined && body !== null) {
        if (typeof body === "string") {
            try {
                requestOptions.body = JSON.parse(body);
                requestOptions.mediaType = "application/json";
            } catch {
                requestOptions.body = body;
                requestOptions.headers = {
                    ...requestOptions.headers,
                    "Content-Type": headers["Content-Type"] ?? headers["content-type"] ?? "text/plain",
                };
            }
        } else {
            requestOptions.body = body;
        }
    }

    return requestOptions as ApiRequestOptions;
};

type WrappedResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

// BE는 { success, data?, error? } 래핑 구조로 응답
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const requestOptions = toRequestOptions(path, options);

    try {
        const json = await request<WrappedResponse<T>>(apiConfig, requestOptions);
        if (!json.success) {
            throw new Error(json.error || `API error: ${path}`);
        }
        return json.data as T;
    } catch (error) {
        if (error instanceof GeneratedApiError && error.status === 401) {
            const newToken = await tryRefreshToken();
            if (newToken) {
                try {
                    const json = await request<WrappedResponse<T>>(
                        {
                            ...apiConfig,
                            TOKEN: newToken,
                        },
                        requestOptions,
                    );
                    if (!json.success) {
                        throw new Error(json.error || `API error: ${path}`);
                    }
                    return json.data as T;
                } catch (retryError) {
                    if (retryError instanceof GeneratedApiError) {
                        throw new Error(`API ${retryError.status}: ${path}`);
                    }
                    throw retryError;
                }
            }
        }

        if (error instanceof GeneratedApiError) {
            throw new Error(`API ${error.status}: ${path}`);
        }
        throw error;
    }
}
