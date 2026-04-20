/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchRequestStatusCountDto } from './MatchRequestStatusCountDto';
export type AdminDbStatsDto = {
    users: number;
    quizSets: number;
    quizzes: number;
    matchRequests: number;
    chatRooms: number;
    ratings: number;
    matchRequestsByStatus: MatchRequestStatusCountDto;
};

