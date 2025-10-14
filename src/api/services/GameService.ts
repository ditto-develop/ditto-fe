/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnswerItem } from '../models/AnswerItem';
import type { SuccessApiResponse } from '../models/SuccessApiResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GameService {
    /**
     * 라운드 질문 조회
     * @param round
     * @returns any
     * @throws ApiError
     */
    public static gameControllerGetQuestions(
        round: number,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/game/{round}/questions',
            path: {
                'round': round,
            },
        });
    }
    /**
     * 라운드 질문 단일 조회 (임시 - 사용할지 안할지 모르겠음)
     * @param round
     * @param questionId
     * @returns any
     * @throws ApiError
     */
    public static gameControllerGetQuestion(
        round: string,
        questionId: string,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/game/{round}/questions/{questionId}',
            path: {
                'round': round,
                'questionId': questionId,
            },
        });
    }
    /**
     * 단일 질문 답안 제출
     * @param round
     * @param questionId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static gameControllerSubmitAnswers(
        round: number,
        questionId: string,
        requestBody: AnswerItem,
    ): CancelablePromise<SuccessApiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/game/{round}/questions/{questionId}/answer',
            path: {
                'round': round,
                'questionId': questionId,
            },
            body: requestBody,
            mediaType: 'application/json'
        });
    }
}
