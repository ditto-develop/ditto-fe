"use client";

import styled from "styled-components";

import { SkeletonBlock } from "@/shared/ui";

/** 좌우·길이를 섞어야 실제 대화처럼 보인다. 균일한 블록은 목록처럼 읽힌다. */
const BUBBLES: { width: string; mine: boolean }[] = [
  { width: "55%", mine: false },
  { width: "40%", mine: true },
  { width: "70%", mine: false },
  { width: "45%", mine: true },
  { width: "60%", mine: false },
  { width: "35%", mine: true },
];

/**
 * 1:1 · 그룹 대화방의 로딩 자리. 두 화면의 헤더 구조가 같아 하나를 공유한다.
 *
 * 치수는 ChatRoomHeader / MessageList / ChatInput에서 그대로 가져왔다.
 * safe-area 인셋을 빠뜨리면 앱(웹뷰)에서만 헤더·입력창이 튀므로 함께 옮긴다.
 * PageContainer 안에 놓이는 것을 전제로 flex: 1을 차지한다.
 */
export function ChatRoomSkeleton() {
  return (
    <Wrapper aria-hidden="true" data-cy="chat-room-skeleton">
      <Header>
        <NavRow>
          <SkeletonBlock $width="24px" $height="24px" />
          <TitleWrapper>
            <SkeletonBlock $width="96px" $height="22px" />
          </TitleWrapper>
          <SkeletonBlock $width="24px" $height="24px" />
        </NavRow>
        <ToolRow>
          <SkeletonBlock $width="72px" $height="18px" />
        </ToolRow>
      </Header>

      <MessageArea>
        {BUBBLES.map((bubble, index) => (
          <BubbleRow key={index} $mine={bubble.mine}>
            {!bubble.mine && <AvatarBlock $width="40px" $height="40px" $circle />}
            <Bubble $width={bubble.width} $height="40px" $radius="12px" />
          </BubbleRow>
        ))}
      </MessageArea>

      <InputArea>
        <SkeletonBlock $width="100%" $height="56px" $radius="12px" />
      </InputArea>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  /* 앱에서 상태바가 웹뷰 위에 겹친다. 웹에서는 0이라 영향이 없다. */
  padding-top: env(safe-area-inset-top, 0px);
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 16px 0;
  box-sizing: border-box;
`;

const TitleWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
`;

const ToolRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding-bottom: 10px;
  box-sizing: border-box;
`;

const MessageArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 16px 16px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* 실제 방은 최신 메시지까지 스크롤된 상태로 열린다. 위가 아니라 아래에 붙여야 실루엣이 맞는다. */
  justify-content: flex-end;
  gap: 10px;
`;

const BubbleRow = styled.div<{ $mine: boolean }>`
  display: flex;
  align-items: flex-end;
  justify-content: ${({ $mine }) => ($mine ? "flex-end" : "flex-start")};
  gap: 12px;
`;

const AvatarBlock = styled(SkeletonBlock)`
  flex-shrink: 0;
`;

const Bubble = styled(SkeletonBlock)`
  max-width: 255px;
`;

const InputArea = styled.div`
  flex-shrink: 0;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
`;
