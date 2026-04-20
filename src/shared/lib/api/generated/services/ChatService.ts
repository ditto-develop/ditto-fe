/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddVoteOptionDto } from '../models/AddVoteOptionDto';
import type { CastVoteDto } from '../models/CastVoteDto';
import type { ChatMessageDto } from '../models/ChatMessageDto';
import type { ChatRoomDetailDto } from '../models/ChatRoomDetailDto';
import type { ChatRoomItemDto } from '../models/ChatRoomItemDto';
import type { CreateChatRoomDto } from '../models/CreateChatRoomDto';
import type { CreateVoteDto } from '../models/CreateVoteDto';
import type { GroupChatRoomDetailDto } from '../models/GroupChatRoomDetailDto';
import type { GroupMessageListDto } from '../models/GroupMessageListDto';
import type { GroupVoteDto } from '../models/GroupVoteDto';
import type { LeaveChatRoomDto } from '../models/LeaveChatRoomDto';
import type { LeaveGroupChatRoomDto } from '../models/LeaveGroupChatRoomDto';
import type { MessageListDto } from '../models/MessageListDto';
import type { SendMessageDto } from '../models/SendMessageDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatService {
    /**
     * 채팅방 목록 조회
     * 내가 참여 중인 채팅방 목록을 조회합니다. 최신 메시지, 안읽은 수를 포함합니다.
     * @returns any 채팅방 목록 조회 성공
     * @throws ApiError
     */
    public static chatControllerGetChatRooms(): CancelablePromise<{
        success?: boolean;
        data?: Array<ChatRoomItemDto>;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms',
            errors: {
                400: `잘못된 요청입니다.`,
                401: `인증이 필요합니다.`,
                403: `접근 권한이 없습니다.`,
                500: `서버 내부 오류가 발생했습니다.`,
            },
        });
    }
    /**
     * 채팅방 생성
     * 매칭 성사된 상대와의 채팅방을 생성합니다. 이미 존재하면 기존 방을 반환합니다.
     * @param requestBody
     * @returns any 채팅방 생성 성공
     * @throws ApiError
     */
    public static chatControllerCreateChatRoom(
        requestBody: CreateChatRoomDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: ChatRoomItemDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms',
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
     * 채팅방 상세 조회
     * 채팅방 상세 정보 (파트너 프로필, 만료 시각 등)를 조회합니다. 참여자만 조회 가능합니다.
     * @param roomId 채팅방 ID
     * @returns any 채팅방 상세 조회 성공
     * @throws ApiError
     */
    public static chatControllerGetChatRoomDetail(
        roomId: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: ChatRoomDetailDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{roomId}',
            path: {
                'roomId': roomId,
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
     * 메시지 목록 조회
     * 채팅방의 메시지를 커서 기반 페이지네이션으로 조회합니다. 최신순 정렬입니다.
     * @param roomId 채팅방 ID
     * @param cursor 페이지 커서 (이전 응답의 nextCursor)
     * @param limit 조회 건수 (기본 30)
     * @returns any 메시지 조회 성공
     * @throws ApiError
     */
    public static chatControllerGetMessages(
        roomId: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<{
        success?: boolean;
        data?: MessageListDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
            },
            query: {
                'cursor': cursor,
                'limit': limit,
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
     * 메시지 전송
     * 채팅방에 메시지를 전송합니다. 참여자만 전송 가능합니다.
     * @param roomId 채팅방 ID
     * @param requestBody
     * @returns any 메시지 전송 성공
     * @throws ApiError
     */
    public static chatControllerSendMessage(
        roomId: string,
        requestBody: SendMessageDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: ChatMessageDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
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
    /**
     * 읽음 처리
     * 채팅방의 메시지를 현재 시각까지 읽음 처리합니다.
     * @param roomId 채팅방 ID
     * @returns any 읽음 처리 성공
     * @throws ApiError
     */
    public static chatControllerMarkAsRead(
        roomId: string,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/chat/rooms/{roomId}/read',
            path: {
                'roomId': roomId,
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
     * 채팅방 나가기
     * 채팅방을 나갑니다. 나간 후에는 재입장할 수 없습니다.
     * @param roomId 채팅방 ID
     * @param requestBody
     * @returns any 채팅방 나가기 성공
     * @throws ApiError
     */
    public static chatControllerLeaveChatRoom(
        roomId: string,
        requestBody: LeaveChatRoomDto,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{roomId}/leave',
            path: {
                'roomId': roomId,
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
    /**
     * 그룹 채팅방 상세 조회
     * 그룹 채팅방 상세 정보 (멤버 목록, 만료 시각 등)를 조회합니다. 참여자만 조회 가능합니다.
     * @param roomId 그룹 채팅방 ID
     * @returns any 그룹 채팅방 상세 조회 성공
     * @throws ApiError
     */
    public static chatControllerGetGroupRoomDetail(
        roomId: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: GroupChatRoomDetailDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/group-rooms/{roomId}',
            path: {
                'roomId': roomId,
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
     * 그룹 채팅 메시지 목록 조회
     * 그룹 채팅방의 메시지를 커서 기반 페이지네이션으로 조회합니다. 각 메시지에 발신자 정보와 unreadCount가 포함됩니다.
     * @param roomId 그룹 채팅방 ID
     * @param cursor 페이지 커서 (이전 응답의 nextCursor)
     * @param limit 조회 건수 (기본 30)
     * @returns any 메시지 조회 성공
     * @throws ApiError
     */
    public static chatControllerGetGroupMessages(
        roomId: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<{
        success?: boolean;
        data?: GroupMessageListDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/group-rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
            },
            query: {
                'cursor': cursor,
                'limit': limit,
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
     * 그룹 채팅 메시지 전송
     * 그룹 채팅방에 메시지를 전송합니다. 참여자만 전송 가능합니다.
     * @param roomId 그룹 채팅방 ID
     * @param requestBody
     * @returns any 메시지 전송 성공
     * @throws ApiError
     */
    public static chatControllerSendGroupMessage(
        roomId: string,
        requestBody: SendMessageDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: ChatMessageDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/group-rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
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
    /**
     * 그룹 채팅 읽음 처리
     * 그룹 채팅방의 메시지를 현재 시각까지 읽음 처리합니다.
     * @param roomId 그룹 채팅방 ID
     * @returns any 읽음 처리 성공
     * @throws ApiError
     */
    public static chatControllerMarkGroupAsRead(
        roomId: string,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/chat/group-rooms/{roomId}/read',
            path: {
                'roomId': roomId,
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
     * 그룹 채팅방 나가기
     * 그룹 채팅방을 나갑니다. 마지막 멤버가 나가면 방이 종료됩니다.
     * @param roomId 그룹 채팅방 ID
     * @param requestBody
     * @returns any 그룹 채팅방 나가기 성공
     * @throws ApiError
     */
    public static chatControllerLeaveGroupChatRoom(
        roomId: string,
        requestBody: LeaveGroupChatRoomDto,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/group-rooms/{roomId}/leave',
            path: {
                'roomId': roomId,
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
    /**
     * 투표 생성
     * 그룹 채팅방에 투표를 생성합니다. 방당 활성 투표는 1개로 제한됩니다.
     * @param roomId 그룹 채팅방 ID
     * @param requestBody
     * @returns any 투표 생성 성공
     * @throws ApiError
     */
    public static chatControllerCreateVote(
        roomId: string,
        requestBody: CreateVoteDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: GroupVoteDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/group-rooms/{roomId}/votes',
            path: {
                'roomId': roomId,
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
    /**
     * 투표 상세 조회
     * 투표 상세 정보와 각 옵션의 투표 현황을 조회합니다.
     * @param roomId 그룹 채팅방 ID
     * @param voteId 투표 ID
     * @returns any 투표 조회 성공
     * @throws ApiError
     */
    public static chatControllerGetVoteDetail(
        roomId: string,
        voteId: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: GroupVoteDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/group-rooms/{roomId}/votes/{voteId}',
            path: {
                'roomId': roomId,
                'voteId': voteId,
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
     * 투표 참여 (선택/변경/취소)
     * 투표에 참여하거나 기존 선택을 변경합니다. 빈 배열을 보내면 해당 타입 투표 취소입니다.
     * @param roomId 그룹 채팅방 ID
     * @param voteId 투표 ID
     * @param requestBody
     * @returns any 투표 참여 성공
     * @throws ApiError
     */
    public static chatControllerCastVote(
        roomId: string,
        voteId: string,
        requestBody: CastVoteDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: GroupVoteDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/group-rooms/{roomId}/votes/{voteId}/cast',
            path: {
                'roomId': roomId,
                'voteId': voteId,
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
    /**
     * 투표 옵션 추가
     * 진행 중인 투표에 장소 또는 시간 옵션을 추가합니다.
     * @param roomId 그룹 채팅방 ID
     * @param voteId 투표 ID
     * @param requestBody
     * @returns any 옵션 추가 성공
     * @throws ApiError
     */
    public static chatControllerAddVoteOption(
        roomId: string,
        voteId: string,
        requestBody: AddVoteOptionDto,
    ): CancelablePromise<{
        success?: boolean;
        data?: GroupVoteDto;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/group-rooms/{roomId}/votes/{voteId}/options',
            path: {
                'roomId': roomId,
                'voteId': voteId,
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
    /**
     * 투표 종료
     * 진행 중인 투표를 종료합니다. 투표 생성자만 종료할 수 있습니다.
     * @param roomId 그룹 채팅방 ID
     * @param voteId 투표 ID
     * @returns any 투표 종료 성공
     * @throws ApiError
     */
    public static chatControllerCloseVote(
        roomId: string,
        voteId: string,
    ): CancelablePromise<{
        success?: boolean;
        error?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/group-rooms/{roomId}/votes/{voteId}/close',
            path: {
                'roomId': roomId,
                'voteId': voteId,
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
