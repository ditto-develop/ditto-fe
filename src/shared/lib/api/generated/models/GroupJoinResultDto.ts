/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GroupJoinResultDto = {
    /**
     * 그룹 채팅방 ID
     */
    roomId: string;
    /**
     * 퀴즈셋 ID
     */
    quizSetId: string;
    /**
     * 현재 참여 인원 수
     */
    participantCount: number;
    /**
     * 3명 이상 참여 시 true — 채팅 시작 가능 상태
     */
    isActive: boolean;
};

