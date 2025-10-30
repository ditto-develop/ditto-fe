/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OmitTypeClass } from '../models/OmitTypeClass';
import type { RegisterEmailRequestDto } from '../models/RegisterEmailRequestDto';
import type { SaveStayTimeRequestDto } from '../models/SaveStayTimeRequestDto';
import type { SuccessApiResponse } from '../models/SuccessApiResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * 무정보 가입 및 jwt 발급 API
     * @param referredBy 추천 받은 코드 값
     * @param utm UTM (유입 경로)
     * @param isRevisit 재시도 여부
     * @returns any
     * @throws ApiError
     */
    public static usersControllerStart(
        referredBy?: string,
        utm?: string,
        isRevisit?: boolean,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/start',
            query: {
                'referredBy': referredBy,
                'utm': utm,
                'isRevisit': isRevisit,
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
    /**
     * 초대 링크 반환
     * @returns any
     * @throws ApiError
     */
    public static usersControllerInvite(): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/invite',
        });
    }
    /**
     * 사이트 이용 시간 저장 API
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersControllerSaveStayTime(
        requestBody: SaveStayTimeRequestDto,
    ): CancelablePromise<OmitTypeClass> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/stay-time',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 결과페이지 도달 API
     * @returns any
     * @throws ApiError
     */
    public static usersControllerSaveIsArrived(): CancelablePromise<OmitTypeClass> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/result-arrived',
        });
    }
}
