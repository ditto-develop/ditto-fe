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
     * @param round
     * @param matchRate 매치율 (x%) - 기본 값(80)
     * @returns any
     * @throws ApiError
     */
    public static matchControllerGetSimilarUsersCount(
        round: number,
        matchRate?: number,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/match/{round}/similar-user-count',
            path: {
                'round': round,
            },
            query: {
                'matchRate': matchRate,
            },
        });
    }
}
