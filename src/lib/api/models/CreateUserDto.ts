/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateUserDto = {
    /**
     * 이름
     */
    name: string;
    /**
     * 닉네임
     */
    nickname: string;
    /**
     * 전화번호
     */
    phoneNumber: string;
    /**
     * 이메일
     */
    email?: string;
    /**
     * 성별
     */
    gender: string;
    /**
     * 나이
     */
    age: number;
    /**
     * 생년월일
     */
    birthDate?: string;
    /**
     * 소셜 로그인 제공자
     */
    provider: string;
    /**
     * 제공자의 사용자 ID
     */
    providerUserId: string;
};

