/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAdminUserDto } from '../models/CreateAdminUserDto';
import type { CreateUserDto } from '../models/CreateUserDto';
import type { LoginDto } from '../models/LoginDto';
import type { LoginResponseDto } from '../models/LoginResponseDto';
import type { SocialLoginDto } from '../models/SocialLoginDto';
import type { UpdateUserDto } from '../models/UpdateUserDto';
import type { UserDto } from '../models/UserDto';
import type { UserSocialAccountDto } from '../models/UserSocialAccountDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * 관리자 계정 생성
     * 관리자 계정을 생성합니다.
     * @param requestBody
     * @returns any 관리자 계정 생성 성공
     * @throws ApiError
     */
    public static userControllerCreateAdmin(
        requestBody: CreateAdminUserDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/admin',
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
     * 일반 사용자 계정 생성
     * 소셜 로그인을 통해 일반 사용자 계정을 생성합니다.
     * @param requestBody
     * @returns any 사용자 계정 생성 성공
     * @throws ApiError
     */
    public static userControllerCreate(
        requestBody: CreateUserDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
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
     * 모든 사용자 조회
     * 관리자가 모든 사용자를 조회합니다.
     * @returns any 사용자 목록 조회 성공
     * @throws ApiError
     */
    public static userControllerFindAll(): CancelablePromise<{
        success?: boolean;
        data?: Array<UserDto>;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 사용자 상세 조회
     * 특정 사용자의 상세 정보를 조회합니다.
     * @param id 사용자 ID
     * @returns any 사용자 조회 성공
     * @throws ApiError
     */
    public static userControllerFindById(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}',
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
    /**
     * 사용자 정보 수정
     * 사용자 정보를 수정합니다.
     * @param id 사용자 ID
     * @param requestBody
     * @returns any 사용자 정보 수정 성공
     * @throws ApiError
     */
    public static userControllerUpdate(
        id: string,
        requestBody: UpdateUserDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `사용자를 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 사용자 영구 삭제
     * 관리자가 사용자를 영구 삭제합니다.
     * @param id 사용자 ID
     * @returns void
     * @throws ApiError
     */
    public static userControllerDelete(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{id}',
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
     * 본인 정보 조회
     * 현재 로그인한 사용자의 정보를 조회합니다.
     * @returns any 본인 정보 조회 성공
     * @throws ApiError
     */
    public static userControllerGetMyProfile(): CancelablePromise<{
        success?: boolean;
        data?: UserDto;
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
     * 사용자 탈퇴
     * 사용자를 탈퇴 처리합니다.
     * @param id 사용자 ID
     * @returns any 사용자 탈퇴 처리 성공
     * @throws ApiError
     */
    public static userControllerLeave(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/{id}/leave',
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
    /**
     * 소셜 계정 추가
     * 사용자에게 소셜 계정을 추가합니다.
     * @param id 사용자 ID
     * @returns any 소셜 계정 추가 성공
     * @throws ApiError
     */
    public static userControllerAddSocialAccount(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: UserSocialAccountDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/{id}/social-accounts',
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
    /**
     * 소셜 계정 제거
     * 사용자의 소셜 계정을 제거합니다.
     * @param id 사용자 ID
     * @param provider 소셜 로그인 제공자
     * @returns void
     * @throws ApiError
     */
    public static userControllerRemoveSocialAccount(
        id: string,
        provider: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{id}/social-accounts/{provider}',
            path: {
                'id': id,
                'provider': provider,
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
     * 관리자 로그인
     * 관리자 계정으로 로그인합니다.
     * @param requestBody
     * @returns any 로그인 성공
     * @throws ApiError
     */
    public static userControllerLogin(
        requestBody: LoginDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: LoginResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증 실패`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 소셜 로그인
     * 소셜 계정으로 로그인합니다.
     * @param requestBody
     * @returns any 로그인 성공
     * @throws ApiError
     */
    public static userControllerSocialLogin(
        requestBody: SocialLoginDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: LoginResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/social-login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증 실패`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 토큰 재발급
     * 리프레시 토큰으로 새로운 액세스/리프레시 토큰을 발급합니다.
     * @returns any 토큰 재발급 성공
     * @throws ApiError
     */
    public static userControllerRefreshToken(): CancelablePromise<{
        success?: boolean;
        data?: LoginResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/refresh',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `리프레시 토큰 검증 실패`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 로그아웃
     * 리프레시 토큰을 폐기하고 쿠키를 제거합니다.
     * @returns any 로그아웃 성공
     * @throws ApiError
     */
    public static userControllerLogout(): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/logout',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
