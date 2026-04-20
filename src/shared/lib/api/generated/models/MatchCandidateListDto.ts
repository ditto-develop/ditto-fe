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
     * 매칭 타입
     */
    matchingType: MatchCandidateListDto.matchingType;
    /**
     * 알고리즘 버전
     */
    algorithmVersion: string;
    /**
     * 후보 목록
     */
    candidates: Array<MatchCandidateDto>;
};
export namespace MatchCandidateListDto {
    /**
     * 매칭 타입
     */
    export enum matchingType {
        ONE_TO_ONE = 'ONE_TO_ONE',
        GROUP = 'GROUP',
    }
}

