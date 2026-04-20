/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntroNotesDto } from '../models/IntroNotesDto';
import type { PublicProfileDto } from '../models/PublicProfileDto';
import type { UpdateIntroNotesDto } from '../models/UpdateIntroNotesDto';
import type { UpdateProfileDto } from '../models/UpdateProfileDto';
import type { UserProfileDto } from '../models/UserProfileDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfileService {
    /**
     * 내 프로필 조회
     * 본인의 프로필(자기소개, 매칭 선호 조건)을 조회합니다.
     * @returns any 프로필 조회 성공
     * @throws ApiError
     */
    public static profileControllerGetMyProfile(): CancelablePromise<{
        success?: boolean;
        data?: UserProfileDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/profile',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 내 프로필 수정
     * 자기소개(최대 300자), 매칭 선호 나이를 수정합니다. null을 전송하면 해당 필드가 초기화됩니다.
     * @param requestBody
     * @returns any 프로필 수정 성공
     * @throws ApiError
     */
    public static profileControllerUpdateMyProfile(
        requestBody: UpdateProfileDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserProfileDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/profile',
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
     * 내 소개 노트 조회
     * 10개 답변 배열과 작성 완료 수를 반환합니다. 미작성 시 빈 문자열 배열을 반환합니다.
     * @returns any 소개 노트 조회 성공
     * @throws ApiError
     */
    public static profileControllerGetIntroNotes(): CancelablePromise<{
        success?: boolean;
        data?: IntroNotesDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/intro-notes',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 내 소개 노트 저장/수정
     * 10개 답변 배열을 저장합니다. 빈 문자열로 부분 저장 가능합니다.
     * @param requestBody
     * @returns any 소개 노트 저장 성공
     * @throws ApiError
     */
    public static profileControllerUpdateIntroNotes(
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
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 타인 소개 노트 조회
     * 매칭 성사 또는 같은 그룹 채팅에 참여한 사용자의 소개 노트를 조회합니다.
     * @param id 대상 사용자 ID
     * @returns any 소개 노트 조회 성공
     * @throws ApiError
     */
    public static profileControllerGetUserIntroNotes(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: IntroNotesDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/intro-notes',
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
     * 타인 프로필 조회
     * 다른 사용자의 공개 프로필을 조회합니다. 민감 정보(이메일, 전화번호)는 포함되지 않습니다.
     * @param id 대상 사용자 ID
     * @returns any 프로필 조회 성공
     * @throws ApiError
     */
    public static profileControllerGetUserProfile(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: PublicProfileDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/profile',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `사용자를 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
