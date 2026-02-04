/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAdminUserDto = {
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
     * 관리자 사용자명
     */
    username: string;
    /**
     * 비밀번호
     */
    password: string;
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
     * 역할 ID
     */
    roleId: number;
};

