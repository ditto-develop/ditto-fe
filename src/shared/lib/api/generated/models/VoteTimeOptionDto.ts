/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VoteTimeOptionDto = {
    /**
     * 옵션 ID
     */
    id: string;
    /**
     * 표시용 날짜 레이블
     */
    dateLabel: string;
    /**
     * 날짜 YYYY-MM-DD
     */
    date?: string | null;
    /**
     * 시간 HH:mm
     */
    time?: string | null;
    /**
     * 이 옵션에 투표한 유저 ID 목록
     */
    voterIds: Array<string>;
};

