/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupJoinResultDto } from '../models/GroupJoinResultDto';
import type { MatchCandidateListDto } from '../models/MatchCandidateListDto';
import type { MatchingStatusDto } from '../models/MatchingStatusDto';
import type { MatchRequestDto } from '../models/MatchRequestDto';
import type { SendMatchRequestDto } from '../models/SendMatchRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MatchingService {
    /**
     * 1:1 매칭 후보 조회
     * Hard filter(퀴즈 완료, 탈퇴 제외, 나이 선호 불일치 제외) + Score(퀴즈 일치율) 기반 최대 5명 반환
     * @returns any 매칭 후보 조회 성공
     * @throws ApiError
     */
    public static matchingControllerGetMatchCandidates(): CancelablePromise<{
        success?: boolean;
        data?: MatchCandidateListDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/matches/1on1',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 매칭 요청 보내기
     * 대상 사용자에게 1:1 대화 매칭 요청 전송
     * @param requestBody
     * @returns any 매칭 요청 전송 성공
     * @throws ApiError
     */
    public static matchingControllerSendMatchRequest(
        requestBody: SendMatchRequestDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: MatchRequestDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/matches/request',
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
     * 매칭 요청 수락
     * @param id 매칭 요청 ID
     * @returns any 매칭 요청 수락 성공
     * @throws ApiError
     */
    public static matchingControllerAcceptMatchRequest(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: MatchRequestDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/matches/request/{id}/accept',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `매칭 요청을 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 매칭 요청 거절
     * @param id 매칭 요청 ID
     * @returns any 매칭 요청 거절 성공
     * @throws ApiError
     */
    public static matchingControllerRejectMatchRequest(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: MatchRequestDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/matches/request/{id}/reject',
            path: {
                'id': id,
            },
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                404: `매칭 요청을 찾을 수 없음`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 매칭 상태 조회
     * 해당 퀴즈셋에서의 매칭 요청 현황
     * @param quizSetId 퀴즈셋 ID
     * @returns any 매칭 상태 조회 성공
     * @throws ApiError
     */
    public static matchingControllerGetMatchingStatus(
        quizSetId: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: MatchingStatusDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/matching/status/{quizSetId}',
            path: {
                'quizSetId': quizSetId,
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
     * 그룹 매칭 참여
     * 현재 완료된 GROUP 퀴즈셋의 그룹 채팅방에 참여 신청
     * @returns any 그룹 참여 성공
     * @throws ApiError
     */
    public static matchingControllerJoinGroup(): CancelablePromise<{
        success?: boolean;
        data?: GroupJoinResultDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/matches/group/join',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 그룹 매칭 거절
     * 이번 주 그룹 매칭 참여를 거절 (이번 주 내 복구 불가)
     * @returns any 그룹 거절 성공
     * @throws ApiError
     */
    public static matchingControllerDeclineGroup(): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/matches/group/decline',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
}
