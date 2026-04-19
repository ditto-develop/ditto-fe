// ────────────────────────────────────────────────────────────
// 채팅 시스템 더미 데이터
// BE 연동 전 UI 확인용. 실제 연동 시 이 파일과 각 컴포넌트의
// "MOCK" 분기를 제거하고 ChatService 호출로 교체하세요.
// ────────────────────────────────────────────────────────────

export const MOCK_MY_ID = "mock-me";
export const MOCK_PARTNER_ID_1 = "mock-partner-1";
export const MOCK_PARTNER_ID_2 = "mock-partner-2";
export const MOCK_PARTNER_ID_3 = "mock-partner-3";

// ── 채팅방 목록 ──────────────────────────────────────────────

export const MOCK_ROOMS = [
  {
    roomId: "room-active-1",
    partnerNickname: "사부작사부작",
    partnerAvatarUrl: "/assets/avatar/f2.png",
    lastMessageContent: "저는 주로 혼자 영화관 가는 걸 좋아해요! 뭔가 낭만 있달까..ㅎㅎ",
    lastMessageAt: "2026-03-13T19:33:00.000Z",
    unreadCount: 3,
    expiresAt: "2026-04-10T00:00:00.000Z", // 진행중
    isGroup: false,
    coParticipantAvatarUrl: null,
  },
  {
    roomId: "room-ended-1",
    partnerNickname: "도시남녀의사랑법",
    partnerAvatarUrl: "/assets/avatar/m3.png",
    lastMessageContent: "네 저도 재밌었어요!",
    lastMessageAt: "2026-01-20T15:00:00.000Z",
    unreadCount: 0,
    expiresAt: "2026-01-25T00:00:00.000Z", // 종료
    isGroup: false,
    coParticipantAvatarUrl: null,
  },
  {
    roomId: "room-ended-2",
    partnerNickname: "댕이누나, 러너쓰하이,...",
    partnerAvatarUrl: "/assets/avatar/f5.png",
    lastMessageContent: "진짜 아쉽네요 ㅠㅠ",
    lastMessageAt: "2026-01-01T12:00:00.000Z",
    unreadCount: 0,
    expiresAt: "2026-01-05T00:00:00.000Z", // 종료
    isGroup: true,
    coParticipantAvatarUrl: "/assets/avatar/m1.png",
  },
];

// ── 채팅방 상세 ──────────────────────────────────────────────

export const MOCK_ROOM_DETAILS: Record<
  string,
  {
    roomId: string;
    expiresAt: string | null;
    partner: {
      userId: string;
      nickname: string;
      profileImageUrl: string | null;
      matchScore: number | null;
    };
  }
> = {
  "room-active-1": {
    roomId: "room-active-1",
    expiresAt: "2026-04-10T00:00:00.000Z",
    partner: {
      userId: MOCK_PARTNER_ID_1,
      nickname: "사부작사부작",
      profileImageUrl: "/assets/avatar/f2.png",
      matchScore: 92,
    },
  },
  "room-ended-1": {
    roomId: "room-ended-1",
    expiresAt: "2026-01-25T00:00:00.000Z",
    partner: {
      userId: MOCK_PARTNER_ID_2,
      nickname: "도시남녀의사랑법",
      profileImageUrl: "/assets/avatar/m3.png",
      matchScore: null,
    },
  },
  "room-ended-2": {
    roomId: "room-ended-2",
    expiresAt: "2026-01-05T00:00:00.000Z",
    partner: {
      userId: MOCK_PARTNER_ID_3,
      nickname: "댕이누나",
      profileImageUrl: "/assets/avatar/f5.png",
      matchScore: null,
    },
  },
};

// ── 메시지 목록 ──────────────────────────────────────────────

const p1 = MOCK_PARTNER_ID_1;
const me = MOCK_MY_ID;

export const MOCK_MESSAGES: Record<
  string,
  Array<{ id: string; senderId: string; content: string; createdAt: string }>
> = {
  "room-active-1": [
    {
      id: "msg-1",
      senderId: p1,
      content: "ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ 웃겨요 어이없어!",
      createdAt: "2026-03-13T10:00:00.000Z",
    },
    {
      id: "msg-2",
      senderId: p1,
      content: "다른 취미는요?",
      createdAt: "2026-03-13T10:01:00.000Z",
    },
    {
      id: "msg-3",
      senderId: p1,
      content: "저는 주로 혼자 영화관 가는 걸 좋아해요! 뭔가 낭만 있달까..ㅎㅎ",
      createdAt: "2026-03-13T19:33:00.000Z",
    },
    {
      id: "msg-4",
      senderId: me,
      content: "ㄱㄱㄱㄱ왜요!",
      createdAt: "2026-03-14T00:10:00.000Z",
    },
    {
      id: "msg-5",
      senderId: me,
      content: "헉 저도 영화 보는 거 좋아해요",
      createdAt: "2026-03-14T00:11:00.000Z",
    },
    {
      id: "msg-6",
      senderId: me,
      content: "제가 낭만없이 못 사는 사람인데... 딱히 볼 거 없는 시기에도 주기적으로 영화관은 가요!",
      createdAt: "2026-03-14T01:23:00.000Z",
    },
  ],
  "room-ended-1": [
    {
      id: "msg-e1-1",
      senderId: MOCK_PARTNER_ID_2,
      content: "안녕하세요! 반갑습니다 ㅎㅎ",
      createdAt: "2026-01-18T14:00:00.000Z",
    },
    {
      id: "msg-e1-2",
      senderId: me,
      content: "안녕하세요! 저도 반가워요 :)",
      createdAt: "2026-01-18T14:05:00.000Z",
    },
    {
      id: "msg-e1-3",
      senderId: MOCK_PARTNER_ID_2,
      content: "취미가 뭐예요?",
      createdAt: "2026-01-19T11:00:00.000Z",
    },
    {
      id: "msg-e1-4",
      senderId: me,
      content: "저는 영화 보는 거랑 산책 좋아해요!",
      createdAt: "2026-01-19T11:10:00.000Z",
    },
    {
      id: "msg-e1-5",
      senderId: MOCK_PARTNER_ID_2,
      content: "네 저도 재밌었어요!",
      createdAt: "2026-01-20T15:00:00.000Z",
    },
  ],
  "room-ended-2": [
    {
      id: "msg-e2-1",
      senderId: MOCK_PARTNER_ID_3,
      content: "좋은 시간이었어요!",
      createdAt: "2026-01-01T10:00:00.000Z",
    },
    {
      id: "msg-e2-2",
      senderId: me,
      content: "진짜 아쉽네요 ㅠㅠ",
      createdAt: "2026-01-01T12:00:00.000Z",
    },
  ],
};
