/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SetSystemOverrideDto = {
    /**
     * 설정할 시스템 기간
     */
    period: SetSystemOverrideDto.period;
};
export namespace SetSystemOverrideDto {
    /**
     * 설정할 시스템 기간
     */
    export enum period {
        QUIZ_PERIOD = 'QUIZ_PERIOD',
        MATCHING_PERIOD = 'MATCHING_PERIOD',
        CHATTING_PERIOD = 'CHATTING_PERIOD',
    }
}

