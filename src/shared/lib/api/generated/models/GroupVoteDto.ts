/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MyVoteDto } from './MyVoteDto';
import type { VotePlaceOptionDto } from './VotePlaceOptionDto';
import type { VoteTimeOptionDto } from './VoteTimeOptionDto';
export type GroupVoteDto = {
    /**
     * 투표 ID
     */
    id: string;
    /**
     * 투표 제목
     */
    title: string;
    /**
     * 복수 선택 허용 여부
     */
    allowMultiple: boolean;
    /**
     * 장소 옵션 목록
     */
    placeOptions: Array<VotePlaceOptionDto>;
    /**
     * 시간 옵션 목록
     */
    timeOptions: Array<VoteTimeOptionDto>;
    /**
     * 채팅방 전체 멤버 수
     */
    totalMembers: number;
    /**
     * 한 번이라도 투표한 멤버 수
     */
    votedCount: number;
    /**
     * 내 투표 선택 (투표 안 했으면 null)
     */
    myVote?: MyVoteDto | null;
    /**
     * 투표 상태
     */
    status: GroupVoteDto.status;
};
export namespace GroupVoteDto {
    /**
     * 투표 상태
     */
    export enum status {
        OPEN = 'OPEN',
        CLOSED = 'CLOSED',
    }
}

