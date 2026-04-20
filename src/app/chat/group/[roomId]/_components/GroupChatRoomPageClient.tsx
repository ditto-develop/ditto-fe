"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import {
  ChatService,
  type GroupVoteDto,
  type GroupChatRoomDetailDto,
  type GroupChatMessageDto,
  type GroupChatMemberDto,
} from "@/shared/lib/api/generated";
import { GroupChatRoomHeader } from "./GroupChatRoomHeader";
import { GroupMessageList } from "./GroupMessageList";
import { GroupChatMenuBottomSheet } from "./GroupChatMenuBottomSheet";
import { GroupMemberListPage } from "./GroupMemberListPage";
import { GroupMemberProfilePage } from "./GroupMemberProfilePage";
import { GroupVoteCreateModal } from "./GroupVoteCreateModal";
import { VoteResultsPage } from "./VoteResultsPage";
import { VoteSubmissionPage } from "./VoteSubmissionPage";
import { VoteBanner } from "./VoteBanner";
import { ChatInput } from "@/app/chat/one-on-one/[roomId]/_components/ChatInput";
import { ChatLeaveModal } from "@/app/chat/one-on-one/[roomId]/_components/ChatLeaveModal";

function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
}

export function GroupChatRoomPageClient() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [roomDetail, setRoomDetail] = useState<GroupChatRoomDetailDto | null>(null);
  const [messages, setMessages] = useState<GroupChatMessageDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVoteCreateOpen, setIsVoteCreateOpen] = useState(false);
  const [activeVote, setActiveVote] = useState<GroupVoteDto | null>(null);
  const [voteView, setVoteView] = useState<"submission" | "results" | null>(null);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupChatMemberDto | null>(null);

  useEffect(() => {
    const userId = getUserIdFromToken();
    setMyUserId(userId);

    const init = async () => {
      try {
        const [detailRes, msgRes] = await Promise.all([
          ChatService.chatControllerGetGroupRoomDetail(roomId),
          ChatService.chatControllerGetGroupMessages(roomId, undefined, 30),
        ]);

        if (detailRes.success && detailRes.data) {
          setRoomDetail(detailRes.data);
        }

        if (msgRes.success && msgRes.data) {
          const msgs = msgRes.data.messages.slice().reverse();
          setMessages(msgs);
          setNextCursor(msgRes.data.nextCursor ?? null);
          setHasMore(!!msgRes.data.nextCursor);
        }

        ChatService.chatControllerMarkGroupAsRead(roomId).catch(() => {});
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [roomId]);

  // Poll room detail for vote changes
  useEffect(() => {
    if (!roomDetail) return;

    let isMounted = true;
    let isFetching = false;

    const refresh = async () => {
      if (isFetching || document.hidden) return;
      isFetching = true;
      try {
        const res = await ChatService.chatControllerGetGroupRoomDetail(roomId);
        if (isMounted && res.success && res.data) {
          setRoomDetail(res.data);
        }
      } catch {
        // ignore
      } finally {
        isFetching = false;
      }
    };

    const id = window.setInterval(refresh, 5000);
    return () => {
      isMounted = false;
      window.clearInterval(id);
    };
  }, [roomId, roomDetail]);

  const handleMessagesUpdate = useCallback(
    (newMessages: GroupChatMessageDto[], cursor: string | null) => {
      setMessages(newMessages);
      setNextCursor(cursor);
      setHasMore(!!cursor);
    },
    []
  );

  const handleSend = async (content: string) => {
    try {
      const res = await ChatService.chatControllerSendGroupMessage(roomId, { content });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as unknown as GroupChatMessageDto]);
      }
    } catch {
      // ignore — polling will pick it up
    }
  };

  const handleLeave = async () => {
    try {
      await ChatService.chatControllerLeaveGroupChatRoom(roomId, { reason: "USER_LEFT" });
    } catch {
      // ignore
    }
    router.replace("/chat");
  };

  const openVote = async (voteId?: string) => {
    const targetVoteId = voteId ?? activeVote?.id ?? roomDetail?.vote?.id;
    if (!targetVoteId) return;

    if (activeVote?.id === targetVoteId) {
      setVoteView(activeVote.myVote ? "results" : "submission");
      return;
    }

    const res = await ChatService.chatControllerGetVoteDetail(roomId, targetVoteId);
    if (res.success && res.data) {
      setActiveVote(res.data);
      setVoteView(res.data.myVote ? "results" : "submission");
    }
  };

  const handleVoteCreated = (vote: GroupVoteDto) => {
    setActiveVote(vote);
    setRoomDetail((prev) =>
      prev
        ? {
            ...prev,
            vote,
          }
        : prev
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <EmptyMessage>불러오는 중...</EmptyMessage>
      </PageContainer>
    );
  }

  if (!roomDetail) {
    return (
      <PageContainer>
        <EmptyMessage>채팅방을 찾을 수 없어요.</EmptyMessage>
      </PageContainer>
    );
  }

  const expiresAt = roomDetail.expiresAt ? new Date(roomDetail.expiresAt) : null;
  const isEnded = roomDetail.isEnded === true;
  const memberNames = roomDetail.members.map((m) => m.nickname);
  const hasVote = roomDetail.vote !== null || activeVote !== null;
  const voteLabel = activeVote?.title ?? roomDetail.vote?.title ?? "만남 투표 진행 중";
  const memberMap = roomDetail.members.reduce<Record<string, string>>((acc, member) => {
    acc[member.userId] = member.nickname;
    return acc;
  }, {});

  return (
    <PageContainer>
      <GroupChatRoomHeader
        memberNames={memberNames}
        totalMembers={roomDetail.totalMembers}
        expiresAt={expiresAt}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {hasVote && (
        <VoteBanner
          label={voteLabel}
          onVoteClick={() => {
            openVote();
          }}
        />
      )}

      <GroupMessageList
        roomId={roomId}
        messages={messages}
        currentUserId={myUserId ?? ""}
        onMessagesUpdate={handleMessagesUpdate}
        nextCursor={nextCursor}
        hasMore={hasMore}
        isEnded={isEnded}
        onVoteMessageClick={openVote}
      />

      {!isEnded && <ChatInput onSend={handleSend} />}

      {isMenuOpen && (
        <GroupChatMenuBottomSheet
          hasVote={hasVote}
          onClose={() => setIsMenuOpen(false)}
          onMemberList={() => setIsMemberListOpen(true)}
          onCreateVote={() => {
            setIsVoteCreateOpen(true);
          }}
          onReport={() => {
            // TODO: 신고하기 화면으로 이동
          }}
          onLeave={() => setIsLeaveModalOpen(true)}
        />
      )}

      {isVoteCreateOpen && (
        <GroupVoteCreateModal
          onClose={() => setIsVoteCreateOpen(false)}
          onComplete={async (payload) => {
            const res = await ChatService.chatControllerCreateVote(roomId, {
              title: "만남 투표 진행 중",
              allowMultiple: payload.allowMultiple,
              placeOptions: payload.placeOptions.map((label) => ({ label })),
              timeOptions: payload.timeOptions,
            });

            if (res.success && res.data) {
              handleVoteCreated(res.data);
            }
          }}
        />
      )}

      {activeVote && voteView === "submission" && (
        <VoteSubmissionPage
          vote={activeVote}
          roomId={roomId}
          onClose={() => setVoteView(null)}
          onVoted={(updatedVote) => {
            setActiveVote(updatedVote);
            setVoteView("results");
          }}
        />
      )}

      {activeVote && voteView === "results" && (
        <VoteResultsPage
          vote={activeVote}
          memberMap={memberMap}
          roomId={roomId}
          onClose={() => setVoteView(null)}
          onRevote={() => setVoteView("submission")}
          onVoteUpdated={(updatedVote) => setActiveVote(updatedVote)}
        />
      )}

      <ChatLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeave}
      />

      {isMemberListOpen && roomDetail && (
        <GroupMemberListPage
          members={roomDetail.members}
          myUserId={myUserId ?? ""}
          onClose={() => setIsMemberListOpen(false)}
          onMemberClick={(member) => {
            setSelectedMember(member);
          }}
        />
      )}

      {selectedMember && (
        <GroupMemberProfilePage
          userId={selectedMember.userId}
          nickname={selectedMember.nickname}
          profileImageUrl={selectedMember.avatarUrl ?? null}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
  overflow: hidden;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
`;
