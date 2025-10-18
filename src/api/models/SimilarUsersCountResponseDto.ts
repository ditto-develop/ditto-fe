/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SimilarUsersCountResponseDto = {
    /**
     * 전체 사용자 수 (본인 제외)
     */
    totalCount: number;
    /**
     * x% 일치한 사용자 수 (본인 제외)
     */
    similarCount: number;
    /**
     * 100% 일치한 사용자 수 (본인 제외)
     */
    sameCount: number;
};

