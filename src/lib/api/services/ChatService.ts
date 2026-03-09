/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageDto } from '../models/ChatMessageDto';
import type { ChatRoomItemDto } from '../models/ChatRoomItemDto';
import type { CreateChatRoomDto } from '../models/CreateChatRoomDto';
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
}
