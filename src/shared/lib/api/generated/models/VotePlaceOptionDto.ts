/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VotePlaceOptionDto = {
    /**
     * 옵션 ID
     */
    id: string;
    /**
     * 장소 레이블
     */
    label: string;
    /**
     * 지도 URL
     */
    mapLink?: string | null;
    /**
     * 이 옵션에 투표한 유저 ID 목록
     */
    voterIds: Array<string>;
};

