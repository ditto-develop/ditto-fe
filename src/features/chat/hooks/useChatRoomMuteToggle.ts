"use client";

import { useCallback, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import { setChatRoomMuted } from "@/features/chat/api/chatApi";
import { describeError } from "@/shared/lib/api/apiError";

/**
 * 대화방별 알림 끄기/켜기(BE 위키 Frontend-QA-Fixes-Guide §5).
 * 성공하면 방 메타를 다시 읽어 isMuted 를 맞춘다. 막는 것은 이 방의 채팅 푸시뿐이라
 * 문구도 "알림"으로만 말한다 — 알림 센터에는 계속 쌓인다.
 */
export function useChatRoomMuteToggle(
  roomId: number,
  isMuted: boolean,
  refreshRoom: () => void | Promise<void>,
): () => Promise<void> {
  const { showToast } = useToast();
  const pendingRef = useRef(false);

  return useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const nextMuted = !isMuted;
    try {
      await setChatRoomMuted(roomId, nextMuted);
      showToast(nextMuted ? "이 대화방 알림을 껐어요." : "이 대화방 알림을 켰어요.", "default");
      await refreshRoom();
    } catch (err: unknown) {
      console.error("Chat room mute toggle failed:", describeError(err));
      showToast("알림 설정을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      pendingRef.current = false;
    }
  }, [isMuted, refreshRoom, roomId, showToast]);
}
