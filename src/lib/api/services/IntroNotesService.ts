/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntroNotesDto } from '../models/IntroNotesDto';
import type { UpdateIntroNotesDto } from '../models/UpdateIntroNotesDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IntroNotesService {
    /**
     * 내 소개 노트 조회
     * @returns any 소개 노트 조회 성공
     * @throws ApiError
     */
    public static introNotesControllerGetMyIntroNotes(): CancelablePromise<{
        success?: boolean;
        data?: IntroNotesDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/intro-notes',
            errors: {
                401: `인증이 필요합니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 내 소개 노트 저장/수정
     * @param requestBody
     * @returns any 소개 노트 저장 성공
     * @throws ApiError
     */
    public static introNotesControllerUpdateMyIntroNotes(
        requestBody: UpdateIntroNotesDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: IntroNotesDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/me/intro-notes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
