/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePlaceOptionDto } from './CreatePlaceOptionDto';
import type { CreateTimeOptionDto } from './CreateTimeOptionDto';
export type CreateVoteDto = {
    /**
     * 투표 제목
     */
    title: string;
    /**
     * 복수 선택 허용 여부
     */
    allowMultiple: boolean;
    /**
     * 장소 옵션 목록
     */
    placeOptions?: Array<CreatePlaceOptionDto>;
    /**
     * 시간 옵션 목록
     */
    timeOptions?: Array<CreateTimeOptionDto>;
};

