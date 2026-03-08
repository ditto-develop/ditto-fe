/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetQuizSetWithProgressResponseDto } from '../models/GetQuizSetWithProgressResponseDto';
import type { QuizProgressDto } from '../models/QuizProgressDto';
import type { SubmitQuizAnswerDto } from '../models/SubmitQuizAnswerDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuizProgressService {
    /**
     * 퀴즈 답변 제출/수정
     * @param requestBody
     * @returns any 답변 제출 성공
     * @throws ApiError
     */
    public static quizProgressControllerSubmitAnswer(
        requestBody: SubmitQuizAnswerDto,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quiz-progress/answers',
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
    /**
     * 현재 주차 퀴즈 진행 상태 조회
     * @returns any 진행 상태 조회 성공
     * @throws ApiError
     */
    public static quizProgressControllerGetProgress(): CancelablePromise<{
        success?: boolean;
        data?: QuizProgressDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quiz-progress/current',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 현재 주차 퀴즈 진행 상태 초기화
     * @returns any 초기화 성공
     * @throws ApiError
     */
    public static quizProgressControllerResetProgress(): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quiz-progress/reset',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 퀴즈 세트 조회 (진행 상태 포함)
     * @param id
     * @returns any 퀴즈 세트 조회 성공
     * @throws ApiError
     */
    public static quizProgressControllerGetQuizSetWithProgress(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: GetQuizSetWithProgressResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quiz-progress/quiz-sets/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `퀴즈 세트를 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
