"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { TopNavigation } from "@/shared/ui";
import { AlertModal } from "@/shared/ui";
import { formatAgeRange } from "@/shared/lib/formatAge";
import type { IntroNoteState } from "@/features/profile";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";
import {
    sendMatchRequest,
    acceptMatchRequest,
    rejectMatchRequest,
} from "@/features/matching/api/matchingApi";
import { ProfileDetailService, type UserRatingSummaryDto } from "@/shared/lib/api/generated";
import { getUserIntroNotes, type IntroNoteAnswer } from "@/features/profile/api/profileApi";
import { useToast } from "@/context/ToastContext";
import { ProfileIntroView } from "@/features/profile/ui/ProfileIntroView";

/**
 * IntroNoteContainer — Figma: 3.2 소개노트
 * 실제 API 연결 + 상태별 버튼 (before_request / after_acceptance / completed / chat_started)
 * chat_started: 매칭 성사 후 프로필 조회 전용 (CTA 버튼 없음)
 */
export function IntroNoteContainer({
    userId,
    quizSetId,
    matchRequestId,
    initialState,
    onBack,
}: {
    userId: string;
    quizSetId?: string;
    matchRequestId?: string;
    initialState: IntroNoteState;
    onBack: () => void;
}) {
    const router = useRouter();
    const { showToast } = useToast();
    const { profile, loading, error } = useUserProfile(userId);
    const [state, setState] = useState<IntroNoteState>(initialState);
    const [acting, setActing] = useState(false);
    const [showModal, setShowModal] = useState<"request" | "accept" | "reject" | null>(null);
    const [introNotes, setIntroNotes] = useState<IntroNoteAnswer[]>([]);
    const [ratingSummary, setRatingSummary] = useState<UserRatingSummaryDto | null>(null);

    useEffect(() => {
        setState(initialState);
    }, [userId]);

    useEffect(() => {
        Promise.all([
            getUserIntroNotes(userId).catch(() => []),
            ProfileDetailService.ratingControllerGetUserRatings(userId)
                .then((res) => res.success ? res.data ?? null : null)
                .catch(() => null),
        ])
            .then(([notes, ratings]) => {
                setIntroNotes(notes);
                setRatingSummary(ratings);
            })
            .catch(() => {/* 무시 */});
    }, [userId]);

    async function confirmRequest() {
        if (!quizSetId || acting) return;
        setShowModal(null);
        setActing(true);
        try {
            await sendMatchRequest(userId, quizSetId);
            setState("completed");
            showToast("대화 신청을 완료했어요.", "success");
        } catch {
            showToast("대화 신청에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
        } finally {
            setActing(false);
        }
    }

    async function confirmAccept() {
        if (!matchRequestId || acting) return;
        setShowModal(null);
        setActing(true);
        try {
            await acceptMatchRequest(matchRequestId);
            router.push("/home?accepted=true");
        } catch {
            showToast("대화 수락에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
        } finally {
            setActing(false);
        }
    }

    async function confirmReject() {
        if (!matchRequestId || acting) return;
        setShowModal(null);
        setActing(true);
        try {
            await rejectMatchRequest(matchRequestId);
            router.push("/home");
        } catch {
            showToast("대화 거절에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
        } finally {
            setActing(false);
        }
    }

    const hasButton = state !== "chat_started";

    return (
        <PageContainer>
            <TopNavigation onBack={onBack} />

            {loading && <StateText>프로필을 불러오는 중...</StateText>}
            {error && <StateText>프로필을 불러오지 못했어요.</StateText>}

            {profile && (
                <IntroPreviewScroll>
                    <ProfileIntroView
                        avatarUrl={profile.avatarUrl}
                        name={profile.nickname}
                        rating={profile.rating}
                        metaText={[
                            formatAgeRange(profile.age),
                            profile.gender,
                            profile.location,
                            profile.occupation,
                        ].filter(Boolean).join(" · ")}
                        interests={profile.interests}
                        introNotes={introNotes}
                        ratingSummary={ratingSummary}
                        hasBottomButton={hasButton}
                    />
                </IntroPreviewScroll>
            )}

            {hasButton && (
                <BottomSection>
                    <GradientFade />
                    <ButtonArea>
                        {state === "completed" ? (
                            <CompletedButton disabled>
                                <ButtonIcon>
                                    <img src="/icons/status/circle-check-fill.svg" alt="" style={{ width: 20, height: 20, opacity: 0.32 }} />
                                </ButtonIcon>
                                대화 신청 완료
                            </CompletedButton>
                        ) : state === "before_request" ? (
                            <PrimaryButton onClick={() => setShowModal("request")} disabled={acting}>
                                <ButtonIcon>
                                    <img src="/icons/action/send.svg" alt="" style={{ width: 16, height: 16 }} />
                                </ButtonIcon>
                                대화 신청하기
                            </PrimaryButton>
                        ) : (
                            <>
                                <SecondaryButton onClick={() => setShowModal("reject")} disabled={acting}>
                                    거절하기
                                </SecondaryButton>
                                <PrimaryButton onClick={() => setShowModal("accept")} disabled={acting}>
                                    대화 수락하기
                                </PrimaryButton>
                            </>
                        )}
                    </ButtonArea>
                </BottomSection>
            )}

            <AlertModal
                isOpen={showModal === "request"}
                title="대화를 신청할까요?"
                message="한 번 신청하면 취소할 수 없어요."
                confirmParams={{
                    text: "네, 신청할게요",
                    onClick: confirmRequest,
                }}
                cancelParams={{
                    text: "취소",
                    onClick: () => setShowModal(null),
                }}
                onClose={() => setShowModal(null)}
            />

            <AlertModal
                isOpen={showModal === "accept"}
                title="대화 신청을 수락할까요?"
                message="한 번 신청하면 취소할 수 없어요."
                confirmParams={{
                    text: "네, 신청할게요",
                    onClick: confirmAccept,
                }}
                cancelParams={{
                    text: "취소",
                    onClick: () => setShowModal(null),
                }}
                onClose={() => setShowModal(null)}
            />

            <AlertModal
                isOpen={showModal === "reject"}
                title="대화 신청을 거절할까요?"
                message="매칭 결과 페이지에서 상대가 삭제되고, 되돌릴 수 없어요."
                confirmParams={{
                    text: "네, 거절할게요",
                    onClick: confirmReject,
                }}
                cancelParams={{
                    text: "아니오",
                    onClick: () => setShowModal(null),
                }}
                onClose={() => setShowModal(null)}
            />
        </PageContainer>
    );
}

const PageContainer = styled.div`
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
`;

const StateText = styled.p`
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
`;

const IntroPreviewScroll = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: calc(var(--space-30) + env(safe-area-inset-bottom, 0px));
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const BottomSection = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
`;

const GradientFade = styled.div`
  height: 40px;
  background: linear-gradient(to bottom, transparent, var(--color-semantic-background-normal-normal));
`;

const ButtonArea = styled.div`
  background-color: var(--color-semantic-background-normal-normal);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  display: flex;
  gap: 8px;
  pointer-events: auto;
`;

const PrimaryButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-inverse-label);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:active:not(:disabled) {
    opacity: 0.9;
  }
`;

const CompletedButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  background-color: var(--color-semantic-background-normal-alternative);
  color: var(--color-semantic-label-assistive);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  cursor: not-allowed;
`;

const ButtonIcon = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  display: flex;
  align-items: center;
`;

const SecondaryButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px solid var(--color-semantic-line-normal-normal);
  border-radius: 12px;
  background-color: var(--color-semantic-background-normal-normal);
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:active:not(:disabled) {
    opacity: 0.9;
  }
`;
