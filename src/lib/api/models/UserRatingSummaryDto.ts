/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RatingItemDto } from './RatingItemDto';
export type UserRatingSummaryDto = {
    /**
     * 대상 사용자 ID
     */
    userId: string;
    /**
     * 총 평가 수
     */
    totalCount: number;
    /**
     * 평균 점수 (공개 시)
     */
    averageScore: number;
    /**
     * 공개 여부
     */
    isPublic: boolean;
    /**
     * 공개 기준 수
     */
    publicThreshold: number;
    /**
     * 개별 평가 목록 (공개 시에만)
     */
    ratings?: Array<RatingItemDto>;
};

