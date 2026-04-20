/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateRatingDto = {
    /**
     * 매칭 요청 ID
     */
    matchRequestId: string;
    /**
     * 평가 점수 (1~5)
     */
    score: number;
    /**
     * 코멘트 (최대 500자)
     */
    comment?: string;
};

