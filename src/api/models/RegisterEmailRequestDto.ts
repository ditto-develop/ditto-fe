/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RegisterEmailRequestDto = {
    /**
     * 이메일
     */
    email: string;
    /**
     * 마케팅 수신 동의 여부
     */
    marketingAgreement: boolean;
    /**
     * 마케팅 수신 동의 일자. (동의 시 Date 형식으로 넘겨줘야함)
     */
    marketingAgreedAt: string;
};

