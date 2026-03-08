/**
 * API Error handling utilities
 */

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public data?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/** API 응답에서 에러 추출 */
export function extractErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "알 수 없는 에러가 발생했습니다.";
}

/** API 호출 래퍼 (에러 핸들링 포함) */
export async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error: unknown) {
        const err = error as { status?: number; body?: { message?: string } };
        throw new ApiError(
            err?.status || 500,
            err?.body?.message || extractErrorMessage(error),
            err?.body,
        );
    }
}
