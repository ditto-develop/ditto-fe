/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FailApiResponse = {
    /**
     * 요청 성공 여부
     */
    success?: boolean;
    /**
     * 에러 메시지
     */
    errorMessage?: string;
    /**
     * 에러 코드
     */
    errorCode?: string;
    /**
     * 트레이스 ID
     */
    traceId?: string;
    /**
     * 추가 진단 정보
     */
    meta?: Record<string, any>;
};

