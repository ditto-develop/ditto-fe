/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SuccessApiResponse } from '../models/SuccessApiResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MatchService {
    /**
     * x% 이상 일치한 사용자 수 조회 API
     * @returns any
     * @throws ApiError
     */
    public static matchControllerGetSimilarUsersCount(): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/match/similar-user-count',
        });
    }
    /**
     * 게임 결과 희귀도 계산 API
     * @returns any
     * @throws ApiError
     */
    public static matchControllerCalculateResultRarity(): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/match/result-rarity',
        });
    }
}
