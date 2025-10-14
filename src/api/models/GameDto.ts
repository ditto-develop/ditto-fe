/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameOptionDto } from './GameOptionDto';
export type GameDto = {
    /**
     * 게임 고유 ID
     */
    id: string;
    /**
     * 질문 텍스트
     */
    text: string;
    /**
     * 라운드 번호
     */
    round: number;
    /**
     * 선택지 (항상 2개여야 함)
     */
    options: Array<GameOptionDto>;
    /**
     * 게임 순서
     */
    index: number;
};

