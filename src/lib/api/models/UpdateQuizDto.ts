/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateQuizChoiceDto } from './UpdateQuizChoiceDto';
export type UpdateQuizDto = {
    /**
     * 퀴즈 질문
     */
    question?: string;
    /**
     * 퀴즈 선택지들 (정확히 2개, 모두 수정 시 필수)
     */
    choices?: Array<UpdateQuizChoiceDto>;
    /**
     * 퀴즈 순서
     */
    order?: number;
};

