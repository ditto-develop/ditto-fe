/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuizDto } from '../models/CreateQuizDto';
import type { QuizDto } from '../models/QuizDto';
import type { UpdateQuizDto } from '../models/UpdateQuizDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuizzesService {
    /**
     * 모든 퀴즈 조회
     * @returns any 퀴즈 목록 조회 성공
     * @throws ApiError
     */
    public static quizControllerFindAll(): CancelablePromise<{
        success?: boolean;
        data?: Array<QuizDto>;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quizzes',
        });
    }
    /**
     * 퀴즈 생성
     * @param requestBody
     * @returns any 퀴즈 생성 성공
     * @throws ApiError
     */
    public static quizControllerCreate(
        requestBody: CreateQuizDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quizzes',
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
     * 퀴즈 조회
     * @param id
     * @returns any 퀴즈 조회 성공
     * @throws ApiError
     */
    public static quizControllerFindById(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quizzes/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `퀴즈를 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 퀴즈 수정
     * @param id
     * @param requestBody
     * @returns any 퀴즈 수정 성공
     * @throws ApiError
     */
    public static quizControllerUpdate(
        id: string,
        requestBody: UpdateQuizDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: QuizDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/quizzes/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `퀴즈를 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 퀴즈 삭제
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static quizControllerDelete(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/quizzes/{id}',
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
}
