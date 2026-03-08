/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuizChoiceDto } from './CreateQuizChoiceDto';
export type CreateQuizDto = {
    /**
     * 퀴즈 질문
     */
    question: string;
    /**
     * 퀴즈 세트 ID
     */
    quizSetId: string;
    /**
     * 퀴즈 선택지들 (정확히 2개)
     */
    choices: Array<CreateQuizChoiceDto>;
    /**
     * 퀴즈 순서 (미지정 시 자동 할당)
     */
    order?: number;
};

