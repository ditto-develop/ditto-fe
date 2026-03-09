/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRatingDto } from '../models/CreateRatingDto';
import type { RatingItemDto } from '../models/RatingItemDto';
import type { UserAnswersComparisonDto } from '../models/UserAnswersComparisonDto';
import type { UserRatingSummaryDto } from '../models/UserRatingSummaryDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfileDetailService {
    /**
     * 상대 답변 비교 조회
     * 매칭 성사된 상대와의 퀴즈 답변을 비교합니다. 퀴즈별 일치 여부와 전체 일치율을 반환합니다.
     * @param id 대상 사용자 ID
     * @returns any 답변 비교 조회 성공
     * @throws ApiError
     */
    public static ratingControllerGetUserAnswers(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserAnswersComparisonDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/answers',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 사용자 평가 조회
     * 누적 평가 3개 이상 시 평균 점수와 개별 평가를 공개합니다. 미달 시 총 평가 수만 반환합니다.
     * @param id 대상 사용자 ID
     * @returns any 평가 조회 성공
     * @throws ApiError
     */
    public static ratingControllerGetUserRatings(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserRatingSummaryDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/ratings',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 사용자 평가 작성
     * 매칭 성사된 상대에 대한 평가를 작성합니다. 같은 매칭 건에 대해 중복 평가는 불가합니다.
     * @param id 대상 사용자 ID
     * @param requestBody
     * @returns any 평가 작성 성공
     * @throws ApiError
     */
    public static ratingControllerCreateRating(
        id: string,
        requestBody: CreateRatingDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: RatingItemDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/{id}/ratings',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
