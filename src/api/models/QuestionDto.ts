/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OptionDto } from './OptionDto';
export type QuestionDto = {
    /**
     * 질문 고유 ID
     */
    id: string;
    /**
     * 밸런스 게임 질문
     */
    text: string;
    /**
     * 선택지
     */
    options: Array<OptionDto>;
    /**
     * 게임 라운드
     */
    round: number;
};

