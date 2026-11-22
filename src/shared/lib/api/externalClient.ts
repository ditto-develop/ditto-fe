import {
    ApiError,
    BLOCKING_SANCTION_CODES,
    notifySanctionedIfBlocked,
    notifySignupIncompleteIfBlocked,
} from "@/shared/lib/api/apiError";
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
 * 세션 검증(refresh)을 **기다리는** 상한. 요청을 끊는 시간이 아니다.
 *
 * fetch에는 기본 타임아웃이 없다. 이 요청이 영영 끝나지 않으면 ClientLayout의
 * `isVerifyingSession`이 true로 굳어 **Splash가 화면을 영구히 덮는다** — 사용자에게는
 * "스플래시에서 안 넘어간다"로 보인다. 그래서 이 시간이 지나면 호출부에는 `unreachable`을 준다.
 *
 * 다만 요청 자체는 끊지 않는다(`REFRESH_REQUEST_LIMIT_MS`). 서버는 refresh를 받는 순간
 * refresh 토큰을 새로 발급하고 옛 토큰을 30초 뒤 만료시킨다(서버 ADR 0034). 예전처럼 8초에
 * abort 하면, 느린 망(앱 복귀 직후 등)에서 서버는 이미 토큰을 바꿨는데 새 쿠키가 담긴 응답을
 * 우리가 버린다. 기기에는 옛 쿠키만 남고, 30초 뒤의 다음 refresh가 2002로 거부돼 로그아웃된다
 * (2026-11-23 조사 — 운영 로그의 2002 묶음). 끝까지 받으면 쿠키는 웹뷰가 알아서 저장한다.
 */
const REFRESH_TIMEOUT_MS = 8000;

/**
 * refresh **요청** 자체의 상한. 이 시간이 지나면 abort 한다.
 *
 * 응답을 끝까지 받으려고 두는 값이라 기다리기 상한보다 길다. 다만 상한이 아예 없으면, 끝나지 않는
 * 요청 하나가 이 문서의 이후 refresh를 전부 붙잡는다(늦은 요청에 합류하므로 — `refreshRequest` 주석).
 * 그동안은 refresh마다 8초씩 기다리다 실패해 홈이 비어 보이므로 오래 둘 수 없다.
 * refresh는 서버 트랜잭션 하나라 20초 넘게 답이 없는 연결은 돌아오지 않는다고 본다.
 */
const REFRESH_REQUEST_LIMIT_MS = 20_000;

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
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * `promise`를 최대 `ms`까지만 기다린다. 늦거나 실패하면 `fallback`.
 * `promise`는 취소하지 않는다 — 뒤에서 계속 진행된다.
 */
function waitAtMost<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => resolve(fallback), ms);
        const settle = (value: T) => {
            clearTimeout(timeoutId);
            resolve(value);
        };
        promise.then(settle, () => settle(fallback));
    });
}

/**
 * refresh 결과.
 *
 * "서버가 이 세션은 끝났다고 답했다"(`rejected`)와 "요청이 서버에 닿지 못했다"
 * (`unreachable`)를 반드시 구분한다. 예전에는 둘 다 `null` 하나로 뭉개서, 네트워크
 * 오류·요청 취소·타임아웃에도 토큰을 지웠다 — 앱이 백그라운드에서 돌아온 직후나
 * 푸시를 탭해 문서가 바뀌는 순간 refresh가 끊기면 쿠키가 멀쩡한데도 로그아웃됐다
 * (BE 위키 Frontend-App-Push-Login-Fix-Request §2).
 *
 * 토큰을 지워도 되는 건 `rejected`뿐이다.
 */
export type RefreshResult =
    | { kind: "ok"; accessToken: string }
    /** 서버가 success:false로 답함. 코드는 0001·0002·2001·2002·6006·6007·6012 등. */
    | { kind: "rejected"; code: string }
    /** 네트워크 오류·취소·타임아웃·5xx — 세션 상태를 알 수 없다. */
    | { kind: "unreachable" };

/**
 * 세션 자체가 끝났다는 거부인가.
 *
 * 제재(6006/6007)는 제외한다 — 세션을 지우고 로그인 화면으로 보내는 대신
 * SanctionGate가 제재 안내 화면으로 보낸다(`notifySanctionedIfBlocked`).
 */
export function isSessionEnded(result: RefreshResult): boolean {
    return result.kind === "rejected" && !BLOCKING_SANCTION_CODES.includes(result.code);
}

function reportRefresh(result: RefreshResult): void {
    trackEvent("auth_refresh", {
        result: result.kind,
        code: result.kind === "rejected" ? result.code : "",
    });
}

/**
 * 지금 날아가고 있는 refresh **요청**. 호출부가 기다리기를 멈춰도(`REFRESH_TIMEOUT_MS`)
 * 응답이 오거나 요청 상한(`REFRESH_REQUEST_LIMIT_MS`)에 걸릴 때까지 남아 있다.
 *
 * 그 사이 refresh를 다시 부르면 새 요청을 보내지 않고 여기에 합류한다. 새로 보내면 같은 옛
 * 쿠키를 또 들고 가는데, 먼저 보낸 요청이 이미 토큰을 바꿨다면 서버는 그 쿠키를 30초만
 * 받아 준다. 합류하면 먼저 보낸 요청의 새 쿠키를 그대로 받는다.
 *
 * 결과만 돌려주고 JS 상태는 건드리지 않는다. 반영은 제때 받은 호출부(`refreshSession`)가 한다.
 */
let refreshRequest: Promise<RefreshResult> | null = null;

function requestRefresh(): Promise<RefreshResult> {
    if (refreshRequest) return refreshRequest;

    const request = (async (): Promise<RefreshResult> => {
        try {
            const refreshUrl = `${getExternalApiBase()}${REFRESH_PATH}`;
            console.log(`[externalApiFetch] → POST ${refreshUrl} (token refresh)`);
            const apiKey = process.env.NEXT_PUBLIC_DITTO_API_KEY;
            const res = await fetchWithTimeout(
                refreshUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(apiKey ? { "X-API-Key": apiKey } : {}),
                    },
                    credentials: "include",
                },
                REFRESH_REQUEST_LIMIT_MS,
            );
            type RefreshData = { accessToken?: string };
            const json = (await res.json().catch(() => null)) as ExternalResponse<RefreshData> | null;
            console.log(`[externalApiFetch] ← ${res.status} POST ${refreshUrl} (token refresh)`, json);
            const newToken = json?.data?.accessToken;
            if (res.ok && json?.success && newToken) return { kind: "ok", accessToken: newToken };
            // 서버가 세션을 판정한 응답이 아니다(게이트웨이 오류·본문 없음).
            if (res.status >= 500 || !json) return { kind: "unreachable" };
            return { kind: "rejected", code: getErrorCode(json.error) };
        } catch {
            return { kind: "unreachable" };
        }
    })();

    refreshRequest = request;
    const clear = () => {
        if (refreshRequest === request) refreshRequest = null;
    };
    request.then(clear, clear);
    return request;
}

// 토큰 refresh 정본: 동시에 여러 401이 발생해도 refresh 요청은 1회만 발생(single-flight).
// generated client(client.ts)의 tryRefreshToken도 이 함수로 위임된다.
let refreshPromise: Promise<RefreshResult> | null = null;

export function refreshSession(): Promise<RefreshResult> {
    if (refreshPromise) return refreshPromise;

    const pending = (async (): Promise<RefreshResult> => {
        const result = await waitAtMost(requestRefresh(), REFRESH_TIMEOUT_MS, { kind: "unreachable" });
        /*
         * 기다리기를 멈춘 뒤 늦게 도착한 결과는 JS 상태에 반영하지 않는다. 호출부는 이미
         * unreachable 로 처리했고, 그 사이 로그아웃했을 수도 있다 — 늦은 accessToken 을 저장하면
         * 끝난 세션이 되살아난다. 새 refresh 쿠키는 응답이 도착할 때 웹뷰가 이미 저장했으므로,
         * 다음 refresh 가 그 쿠키로 새 accessToken 을 받는다.
         */
        if (result.kind === "ok") setTokens(result.accessToken);
        if (result.kind === "rejected") notifySanctionedIfBlocked(result.code);
        reportRefresh(result);
        return result;
    })();

    refreshPromise = pending;
    const clear = () => {
        if (refreshPromise === pending) refreshPromise = null;
    };
    pending.then(clear, clear);
    return pending;
}

/** 새 accessToken만 필요한 호출부용. 실패 사유를 구분해야 하면 `refreshSession`을 쓴다. */
export async function refreshAccessToken(): Promise<string | null> {
    const result = await refreshSession();
    return result.kind === "ok" ? result.accessToken : null;
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
            const refreshed = await refreshSession();
            if (refreshed.kind === "ok") {
                const newToken = refreshed.accessToken;
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
            // 서버가 세션을 끝냈을 때만 지운다. 닿지 못했으면(unreachable) 쿠키가 살아 있을
            // 수 있으니 로그인 상태는 두고 에러만 올린다 — 다음 요청이 다시 refresh 한다.
            if (isSessionEnded(refreshed)) clearTokens();
        }
        reportApiError(path, err);
        throw err;
    }
}

