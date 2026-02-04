/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SystemStateDto = {
    /**
     * 현재 년도
     */
    year: number;
    /**
     * 현재 월
     */
    month: number;
    /**
     * 현재 주차
     */
    week: number;
    /**
     * 현재 시스템 기간 상태
     */
    period: SystemStateDto.period;
};
export namespace SystemStateDto {
    /**
     * 현재 시스템 기간 상태
     */
    export enum period {
        QUIZ_PERIOD = 'QUIZ_PERIOD',
        MATCHING_PERIOD = 'MATCHING_PERIOD',
        CHATTING_PERIOD = 'CHATTING_PERIOD',
    }
}

