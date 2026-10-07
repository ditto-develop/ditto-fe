"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { TopNavigation } from "@/shared/ui";

interface RatingStateScreenProps {
  message: string;
}

/**
 * 평가 폼을 그릴 수 없을 때(불러오는 중·실패·평가 없음)의 화면.
 *
 * 평가 화면은 푸시·알림 센터 딥링크와 방 종료(replace)로 바로 들어와 돌아갈 이전 화면이 없을 수
 * 있다. 닫기가 없으면 "완료했거나 아직 열리지 않은 평가"에서 빠져나갈 길이 없으므로, 폼의
 * 건너뛰기와 같은 대화방 목록으로 보낸다.
 */
export function RatingStateScreen({ message }: RatingStateScreenProps) {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation onClose={() => router.replace("/chat")} />
      <Message>{message}</Message>
    </Page>
  );
}

const Page = styled.main`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Message = styled.div`
  display: flex;
  flex: 1 0 0;
  align-items: center;
  justify-content: center;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
