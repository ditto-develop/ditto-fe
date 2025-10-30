/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StatisticsService {
    /**
     * @param round
     * @returns any
     * @throws ApiError
     */
    public static statisticsControllerGetStatistics(
        round: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/statistics/{round}',
            path: {
                'round': round,
            },
        });
    }
    /**
     * @param round
     * @returns any
     * @throws ApiError
     */
    public static statisticsControllerGetStatisticsExcel(
        round: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/statistics/{round}/excel',
            path: {
                'round': round,
            },
        });
    }
}
