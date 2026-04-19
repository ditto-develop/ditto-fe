import { ApiError as GeneratedApiError } from "./generated/core/ApiError";
import type { ApiRequestOptions } from "./generated/core/ApiRequestOptions";
import { OpenAPI, type OpenAPIConfig } from "./generated/core/OpenAPI";
import { request } from "./generated/core/request";
import { getApiBase } from "./client";

const getAdminToken = (): string => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminAccessToken") ?? "";
};

const adminConfig: OpenAPIConfig = {
    ...OpenAPI,
    BASE: `${getApiBase()}/api`,
    WITH_CREDENTIALS: false,
    CREDENTIALS: "include",
    TOKEN: async () => getAdminToken(),
};

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
    const requestOptions: MutableApiRequestOptions = {
        method,
        url: path,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };

    if (options.body !== undefined && options.body !== null) {
        if (typeof options.body === "string") {
            try {
                requestOptions.body = JSON.parse(options.body);
                requestOptions.mediaType = "application/json";
            } catch {
                requestOptions.body = options.body;
                requestOptions.headers = {
                    ...requestOptions.headers,
                    "Content-Type": headers["Content-Type"] ?? headers["content-type"] ?? "text/plain",
                };
            }
        } else {
            requestOptions.body = options.body;
        }
    }

    return requestOptions as ApiRequestOptions;
};

const getErrorText = (body: unknown): string => {
    if (typeof body === "string") return body;
    if (body === undefined) return "";
    try {
        return JSON.stringify(body);
    } catch {
        return String(body);
    }
};

export async function adminFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    try {
        const body = await request<T | string | undefined>(adminConfig, toRequestOptions(path, options));
        if (typeof body === "string") {
            return undefined as T;
        }
        return body as T;
    } catch (error) {
        if (error instanceof GeneratedApiError) {
            throw new Error(`[${error.status}] ${getErrorText(error.body)}`);
        }
        throw error;
    }
}
