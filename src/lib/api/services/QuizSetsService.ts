/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuizSetDto } from '../models/CreateQuizSetDto';
import type { CurrentWeekQuizSetsResponseDto } from '../models/CurrentWeekQuizSetsResponseDto';
import type { QuizSetDto } from '../models/QuizSetDto';
import type { QuizSetGroupedResponseDto } from '../models/QuizSetGroupedResponseDto';
import type { ReorderQuizzesDto } from '../models/ReorderQuizzesDto';
import type { UpdateQuizSetDto } from '../models/UpdateQuizSetDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuizSetsService {
    /**
     * 퀴즈 세트 생성
     * @param requestBody
     * @returns any 퀴즈 세트 생성 성공
     * @throws ApiError
     */
    public static quizSetControllerCreate(
        requestBody: CreateQuizSetDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizSetDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quiz-sets',
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
     * 퀴즈 세트 목록 조회
     * @param year 년도 필터
     * @param month 월 필터
     * @param week 주차 필터
     * @param category 카테고리 필터
     * @param isActive 활성화 여부 필터
     * @returns any 퀴즈 세트 목록 조회 성공
     * @throws ApiError
     */
    public static quizSetControllerFindAll(
        year?: number,
        month?: number,
        week?: number,
        category?: string,
        isActive?: boolean,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizSetGroupedResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quiz-sets',
            query: {
                'year': year,
                'month': month,
                'week': week,
                'category': category,
                'isActive': isActive,
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
     * 이번 주차 퀴즈 세트 조회
     * @returns any 이번 주차 퀴즈 세트 조회 성공
     * @throws ApiError
     */
    public static quizSetControllerGetCurrentWeek(): CancelablePromise<{
        success?: boolean;
        data?: CurrentWeekQuizSetsResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quiz-sets/current-week',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 퀴즈 세트 조회
     * @param id
     * @returns any 퀴즈 세트 조회 성공
     * @throws ApiError
     */
    public static quizSetControllerFindById(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizSetDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quiz-sets/{id}',
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
    /**
     * 퀴즈 세트 수정
     * @param id
     * @param requestBody
     * @returns any 퀴즈 세트 수정 성공
     * @throws ApiError
     */
    public static quizSetControllerUpdate(
        id: string,
        requestBody: UpdateQuizSetDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizSetDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/quiz-sets/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `퀴즈 세트를 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 퀴즈 세트 삭제
     * @param id
     * @param forcePassword
     * @returns void
     * @throws ApiError
     */
    public static quizSetControllerDelete(
        id: string,
        forcePassword: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/quiz-sets/{id}',
            path: {
                'id': id,
            },
            query: {
                'forcePassword': forcePassword,
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
     * 퀴즈 세트 활성화
     * @param id
     * @returns any 퀴즈 세트 활성화 성공
     * @throws ApiError
     */
    public static quizSetControllerActivate(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizSetDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quiz-sets/{id}/activate',
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
    /**
     * 퀴즈 세트 비활성화
     * @param id
     * @returns any 퀴즈 세트 비활성화 성공
     * @throws ApiError
     */
    public static quizSetControllerDeactivate(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quiz-sets/{id}/deactivate',
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
    /**
     * 퀴즈 순서 일괄 변경 및 관리
     * @param id
     * @param requestBody
     * @returns any 퀴즈 순서 변경 성공
     * @throws ApiError
     */
    public static quizSetControllerReorder(
        id: string,
        requestBody: ReorderQuizzesDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizSetDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/quiz-sets/{id}/reorder',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
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
