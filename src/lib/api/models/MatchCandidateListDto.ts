/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchCandidateDto } from './MatchCandidateDto';
export type MatchCandidateListDto = {
    /**
     * 퀴즈셋 ID
     */
    quizSetId: string;
    /**
     * 알고리즘 버전
     */
    algorithmVersion: string;
    /**
     * 후보 목록
     */
    candidates: Array<MatchCandidateDto>;
};

