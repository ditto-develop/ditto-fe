/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScoreBreakdownDto } from './ScoreBreakdownDto';
export type MatchCandidateDto = {
    /**
     * 사용자 ID
     */
    userId: string;
    /**
     * 닉네임
     */
    nickname: string;
    /**
     * 성별
     */
    gender: string;
    /**
     * 나이
     */
    age: number;
    /**
     * 자기소개
     */
    introduction?: string;
    /**
     * 지역
     */
    location?: string;
    /**
     * 매칭 점수 (0~100)
     */
    matchRate: number;
    /**
     * 스코어 상세
     */
    scoreBreakdown: ScoreBreakdownDto;
};

