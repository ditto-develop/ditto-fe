/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RegisterEmailRequestDto } from '../models/RegisterEmailRequestDto';
import type { SuccessApiResponse } from '../models/SuccessApiResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * 무정보 가입 및 jwt 발급 API
     * @param referredBy
     * @returns any
     * @throws ApiError
     */
    public static usersControllerStart(
        referredBy?: string,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/start',
            query: {
                'referredBy': referredBy,
            },
        });
    }
    /**
     * 이메일 저장 API
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersControllerUpdateEmail(
        requestBody: RegisterEmailRequestDto,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
