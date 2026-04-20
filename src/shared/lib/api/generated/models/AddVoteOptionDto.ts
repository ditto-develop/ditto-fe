/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AddVoteOptionDto = {
    /**
     * 옵션 유형
     */
    type: AddVoteOptionDto.type;
    /**
     * 장소 레이블 (PLACE 타입)
     */
    label?: string;
    /**
     * 지도 URL (PLACE 타입)
     */
    mapLink?: string;
    /**
     * 표시용 날짜 레이블 (TIME 타입)
     */
    dateLabel?: string;
    /**
     * 날짜 YYYY-MM-DD (TIME 타입)
     */
    date?: string;
    /**
     * 시간 HH:mm (TIME 타입)
     */
    time?: string;
};
export namespace AddVoteOptionDto {
    /**
     * 옵션 유형
     */
    export enum type {
        PLACE = 'PLACE',
        TIME = 'TIME',
    }
}

