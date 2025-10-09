/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserResponseDto } from './CreateUserResponseDto';
export type StartResponseDto = {
    /**
     * 사용자 정보
     */
    user: CreateUserResponseDto;
    /**
     * jwt
     */
    jwt: string;
    /**
     * 추천인 링크
     */
    referralLink: string;
};

