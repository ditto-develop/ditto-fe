/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemStateDto } from '../models/SystemStateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * 현재 시스템 주차 및 기간 상태 조회
     * @returns any 시스템 상태 조회 성공
     * @throws ApiError
     */
    public static systemControllerGetSystemState(): CancelablePromise<{
        success?: boolean;
        data?: SystemStateDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/system/state',
        });
    }
}
