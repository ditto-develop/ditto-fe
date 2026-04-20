/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminActiveQuizSetDto } from '../models/AdminActiveQuizSetDto';
import type { AdminCreateDummyMatchRequestDto } from '../models/AdminCreateDummyMatchRequestDto';
import type { AdminCreateDummyMatchResultDto } from '../models/AdminCreateDummyMatchResultDto';
import type { AdminDbStatsDto } from '../models/AdminDbStatsDto';
import type { AdminMatchListResponseDto } from '../models/AdminMatchListResponseDto';
import type { AdminQuizProgressResponseDto } from '../models/AdminQuizProgressResponseDto';
import type { AdminSeedDummyResultDto } from '../models/AdminSeedDummyResultDto';
import type { MatchCandidateListDto } from '../models/MatchCandidateListDto';
import type { SetSystemOverrideDto } from '../models/SetSystemOverrideDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * DB 통계 조회
     * @returns any DB 통계 조회 성공
     * @throws ApiError
     */
    public static adminControllerGetDbStats(): CancelablePromise<{
        success?: boolean;
        data?: AdminDbStatsDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/stats',
        });
    }
    /**
     * 전체 매칭 요청 목록 조회
     * @param page 페이지 번호 (1부터)
     * @param limit 페이지당 항목 수
     * @param status 매칭 상태 필터
     * @param quizSetId 퀴즈셋 ID 필터
     * @param matchingType 매칭 유형 필터 (ONE_TO_ONE | GROUP)
     * @returns any 매칭 목록 조회 성공
     * @throws ApiError
     */
    public static adminControllerGetAllMatches(
        page: number = 1,
        limit: number = 50,
        status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED',
        quizSetId?: string,
        matchingType?: 'ONE_TO_ONE' | 'GROUP',
    ): CancelablePromise<{
        success?: boolean;
        data?: AdminMatchListResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/matches',
            query: {
                'page': page,
                'limit': limit,
                'status': status,
                'quizSetId': quizSetId,
                'matchingType': matchingType,
            },
        });
    }
    /**
     * 시스템 기간 오버라이드 설정
     * @param requestBody
     * @returns any 오버라이드 설정 성공
     * @throws ApiError
     */
    public static adminControllerSetSystemOverride(
        requestBody: SetSystemOverrideDto,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/system/override',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 시스템 기간 오버라이드 해제
     * @returns any 오버라이드 해제 성공
     * @throws ApiError
     */
    public static adminControllerClearSystemOverride(): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/system/override',
        });
    }
    /**
     * 이번주 퀴즈 진행 현황 조회
     * @returns any 퀴즈 진행 현황 조회 성공
     * @throws ApiError
     */
    public static adminControllerGetQuizProgress(): CancelablePromise<{
        success?: boolean;
        data?: AdminQuizProgressResponseDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/quiz-progress',
        });
    }
    /**
     * 현재 주차 전체 퀴즈 진행 상황 초기화 (모든 사용자)
     * @returns any 퀴즈 초기화 성공
     * @throws ApiError
     */
    public static adminControllerResetAllQuizProgress(): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/quiz-progress/reset',
        });
    }
    /**
     * 더미 데이터 생성 (1:1 50명 + GROUP 50명)
     * @returns any 더미 데이터 생성 성공
     * @throws ApiError
     */
    public static adminControllerSeedDummyData(): CancelablePromise<{
        success?: boolean;
        data?: AdminSeedDummyResultDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/seed-dummy',
        });
    }
    /**
     * 특정 사용자의 매칭 후보 조회 (관리자용)
     * @param userId
     * @returns any 매칭 후보 조회 성공
     * @throws ApiError
     */
    public static adminControllerGetMatchCandidates(
        userId: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: MatchCandidateListDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users/{userId}/match-candidates',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * 현재 활성화된 퀴즈셋 목록 조회
     * @returns any 활성 퀴즈셋 조회 성공
     * @throws ApiError
     */
    public static adminControllerGetActiveQuizSets(): CancelablePromise<{
        success?: boolean;
        data?: AdminActiveQuizSetDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/quiz-sets/active',
        });
    }
    /**
     * 더미 유저 → 실제 유저 대화 신청 생성 (관리자용)
     * @param requestBody
     * @returns any 대화 신청 생성 성공
     * @throws ApiError
     */
    public static adminControllerCreateDummyMatchRequest(
        requestBody: AdminCreateDummyMatchRequestDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: AdminCreateDummyMatchResultDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/match-requests/dummy-request',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
