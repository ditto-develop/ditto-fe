/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateProfileDto = {
    /**
     * 자기소개 (최대 300자, null 전송 시 삭제)
     */
    introduction?: string;
    /**
     * 선호 최소 나이 (18~100, null 전송 시 삭제)
     */
    preferredMinAge?: number;
    /**
     * 선호 최대 나이 (18~100, null 전송 시 삭제)
     */
    preferredMaxAge?: number;
};

