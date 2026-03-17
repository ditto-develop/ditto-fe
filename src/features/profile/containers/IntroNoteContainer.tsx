"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { TopNavigation } from "@/shared/ui/TopNavigation";
import AlertModal from "@/components/display/AlertModal";
import { formatAgeRange } from "@/shared/lib/formatAge";
import type { IntroNoteState } from "@/features/profile";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";
import {
    sendMatchRequest,
    acceptMatchRequest,
    rejectMatchRequest,
} from "@/features/matching/api/matchingApi";
import { ProfileDetailService, type AnswerComparisonItemDto } from "@/lib/api";
import { getUserIntroNotes, type IntroNoteAnswer } from "@/features/profile/api/profileApi";
import { useToast } from "@/context/ToastContext";
import ProfileIntroView, { QnACard } from "@/features/profile/ui/ProfileIntroView";

/**
 * IntroNoteContainer — Figma: 3.2 소개노트
 * 실제 API 연결 + 상태별 버튼 (before_request / after_acceptance / completed / chat_started)
 */
export default function IntroNoteContainer({
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
  console.log('[src/features/profile/containers/IntroNoteContainer.tsx] IntroNoteContainer'); // __component_log__
    const router = useRouter();
    const { showToast } = useToast();
    const { profile, loading, error } = useUserProfile(userId);
    const [state, setState] = useState<IntroNoteState>(initialState);
    const [acting, setActing] = useState(false);
    const [showModal, setShowModal] = useState<"request" | "accept" | "reject" | null>(null);
    const [comparisons, setComparisons] = useState<AnswerComparisonItemDto[]>([]);
    const [introNotes, setIntroNotes] = useState<IntroNoteAnswer[]>([]);

    // userId가 바뀔 때(다른 프로필로 이동) 상태 초기화
    useEffect(() => {
        setState(initialState);
    }, [userId]);

    // chat_started: 전체 Q&A 비교 데이터 로드
    useEffect(() => {
        if (state !== "chat_started") return;
        ProfileDetailService.ratingControllerGetUserAnswers(userId)
            .then((res) => {
                if (res.success && res.data?.comparisons) {
                    setComparisons(res.data.comparisons);
                }
            })
            .catch(() => {/* 무시 */});
    }, [state, userId]);

    // before_request / after_acceptance / completed: 소개노트 답변 미리보기 로드
    useEffect(() => {
        if (state === "chat_started") return;
        getUserIntroNotes(userId)
            .then(setIntroNotes)
            .catch(() => {/* 무시 */});
    }, [userId, state]);

    // --- 대화 신청 ---
    async function confirmRequest() {
        if (!quizSetId || acting) return;
        setShowModal(null);
        setActing(true);
        try {
            await sendMatchRequest(userId, quizSetId);
            setState("completed");
            showToast("대화 신청을 완료했어요.", "success");
        } finally {
            setActing(false);
        }
    }

    // --- 대화 수락 ---
    async function confirmAccept() {
        if (!matchRequestId || acting) return;
        setShowModal(null);
        setActing(true);
        try {
            await acceptMatchRequest(matchRequestId);
            router.push("/home?accepted=true");
        } finally {
            setActing(false);
        }
    }

    // --- 대화 거절 ---
    async function confirmReject() {
        if (!matchRequestId || acting) return;
        setShowModal(null);
        setActing(true);
        try {
            await rejectMatchRequest(matchRequestId);
            router.push("/home");
        } finally {
            setActing(false);
        }
    }

    return (
        <PageContainer>
            <TopNavigation onBack={onBack} />

            {loading && <StateText>프로필을 불러오는 중...</StateText>}
            {error && <StateText>프로필을 불러오지 못했어요.</StateText>}

            {profile && (
                state === "chat_started" ? (
                    <>
                        {/* Profile Hero + Q&A comparison (chat_started only) */}
                        <ChatProfileSection>
                            <AvatarWrapper>
                                <AvatarImg src={profile.avatarUrl} alt={profile.nickname} />
                            </AvatarWrapper>
                            <NameRow>
                                <ProfileName>{profile.nickname}</ProfileName>
                                {profile.rating && (
                                    <RatingBadge>
                                        <RatingStar>★</RatingStar>
                                        <RatingText>{profile.rating}</RatingText>
                                    </RatingBadge>
                                )}
                            </NameRow>
                            <ProfileMeta>
                                {formatAgeRange(profile.age)} · {profile.gender}
                                {profile.location ? ` · ${profile.location}` : ""}
                                {profile.occupation ? ` · ${profile.occupation}` : ""}
                            </ProfileMeta>
                        </ChatProfileSection>

                        <QnACard>
                            <TicketDeco src="/assets/decoration/deco.svg" alt="" />
                            <ChatQnABody>
                                {comparisons.map((item, i) => (
                                    <QAItem key={item.quizId ?? i}>
                                        <QAQuestion>{item.question}</QAQuestion>
                                        <QAAnswerRow>
                                            <QAAnswerChip $isMatch={item.isMatch} $isMe>
                                                나 · {item.myChoice}
                                            </QAAnswerChip>
                                            <QAAnswerChip $isMatch={item.isMatch}>
                                                상대 · {item.theirChoice}
                                            </QAAnswerChip>
                                        </QAAnswerRow>
                                    </QAItem>
                                ))}
                            </ChatQnABody>
                        </QnACard>
                    </>
                ) : (
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
                    />
                )
            )}

            {/* Bottom Action Area — state-dependent */}
            {state !== "chat_started" && (
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
                            /* after_acceptance: 수신자 화면 */
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

            {/* ── Alert Modals ── */}

            {/* 대화 신청 확인 */}
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

            {/* 대화 수락 확인 */}
            <AlertModal
                isOpen={showModal === "accept"}
                title="대화 신청을 수락할까요?"
                message={`한 번 신청하면 취소할 수 없어요. `}
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

            {/* 대화 거절 확인 */}
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

// --- Styled Components ---
const PageContainer = styled.div`
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
`;

const StateText = styled.p`
  font-size: 14px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
`;

// chat_started: profile hero (interests excluded)
const ChatProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 0;
  width: 100%;
`;

const AvatarWrapper = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  border: 1px solid rgba(108, 101, 95, 0.08);
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`;

const ProfileName = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: var(--color-semantic-label-normal, #1A1815);
`;

const RatingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RatingStar = styled.span`
  font-size: 14px;
  color: var(--color-semantic-status-positive, #557A55);
`;

const RatingText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-semantic-status-positive, #557A55);
`;

const ProfileMeta = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  line-height: 1.5;
  margin-top: 4px;
`;

const TicketDeco = styled.img`
  width: 80%;
  height: auto;
  display: block;
  margin: 0 auto;
  transform: translateY(-50%);
  margin-bottom: -14px;
`;

// chat_started: Q&A comparison body (no bottom button padding needed)
const ChatQnABody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

// Q&A full view (chat_started)
const QAItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QAQuestion = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-semantic-label-normal);
  margin: 0;
`;

const QAAnswerRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const QAAnswerChip = styled.span<{ $isMatch: boolean; $isMe?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background-color: ${({ $isMatch, $isMe }) =>
    $isMatch
      ? "rgba(85, 122, 85, 0.12)"
      : $isMe
      ? "rgba(108, 101, 95, 0.08)"
      : "rgba(179, 53, 40, 0.08)"};
  color: ${({ $isMatch, $isMe }) =>
    $isMatch
      ? "var(--color-semantic-status-positive, #557A55)"
      : $isMe
      ? "var(--color-semantic-label-normal)"
      : "var(--color-semantic-status-negative, #B33528)"};
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
  background: linear-gradient(to bottom, transparent, var(--color-semantic-background-normal-normal, #F2F0ED));
`;

const ButtonArea = styled.div`
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
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
  background-color: var(--color-semantic-primary-normal, #1A1815);
  color: var(--color-semantic-inverse-label, #FAF9F7);
  font-size: 16px;
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
  background-color: var(--color-semantic-background-normal-alternative, #DDD8D3);
  color: var(--color-semantic-label-assistive, rgba(47, 43, 39, 0.28));
  font-size: 16px;
  font-weight: 600;
  cursor: not-allowed;
`;

const ButtonIcon = styled.span`
  font-size: 14px;
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
  background-color: var(--color-semantic-background-normal-normal, #F2F0ED);
  color: var(--color-semantic-label-normal);
  font-size: 16px;
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
