/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleDto } from '../models/RoleDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoleService {
    /**
     * 모든 Role 조회
     * 모든 Role을 조회합니다.
     * @returns any 모든 Role 조회 성공
     * @throws ApiError
     */
    public static roleControllerFindAll(): CancelablePromise<{
        success?: boolean;
        data?: Array<RoleDto>;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/roles',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * Role 조회
     * ID로 특정 Role을 조회합니다.
     * @param id Role ID
     * @returns any Role 조회 성공
     * @throws ApiError
     */
    public static roleControllerFindById(
        id: number,
    ): CancelablePromise<{
        success?: boolean;
        data?: RoleDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/roles/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `Role을 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
