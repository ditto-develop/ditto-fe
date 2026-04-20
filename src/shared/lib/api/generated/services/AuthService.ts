/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KakaoCallbackDto } from '../models/KakaoCallbackDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * 카카오 OAuth 콜백 - 인가 코드로 사용자 정보 조회
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static kakaoControllerKakaoCallback(
        requestBody: KakaoCallbackDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/kakao/callback',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
