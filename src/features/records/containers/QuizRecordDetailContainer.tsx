"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

import { MainBottomNav } from "@/app/home/MainBottomNav";
import { useQuizRecordDetail } from "@/features/records/hooks/useQuizRecords";
import { useRevealCountdown } from "@/features/records/hooks/useRevealCountdown";
import { RecordAnswerList } from "@/features/records/ui/RecordAnswerList";
import { RecordDetailHeaderCard } from "@/features/records/ui/RecordDetailHeaderCard";
import { RecordResultList } from "@/features/records/ui/RecordResultList";
import { RecordDetailSkeleton, RecordsLoadError } from "@/features/records/ui/RecordsStates";
import { goBackOr } from "@/shared/lib/navigation";
import { Icon, TopNavigation } from "@/shared/ui";

/** 기기 시계가 서버보다 빨라 0이 됐는데 아직 공개 전이면, 이 간격으로 다시 묻는다. */
const REVEAL_RECHECK_MS = 30_000;

type QuizRecordDetailContainerProps = {
  quizSetId: number;
};

/**
 * 퀴즈셋 하나의 기록. 서버 `revealed` 로 두 화면이 갈린다.
 * - 공개 전: "N주차 퀴즈" — 내 답변 보기 [3254:37938]
 * - 공개 후: "N주차 퀴즈 결과" — 마감 후 퀴즈 결과 [3255:37086]
 *
 * 공개 전 화면을 띄워 둔 채 공개 시각(목 0시)이 지나면 다시 불러 결과 화면으로 바꾼다.
 */
export function QuizRecordDetailContainer({ quizSetId }: QuizRecordDetailContainerProps) {
  const router = useRouter();
  const { data, loading, error, reload, invalidId } = useQuizRecordDetail(quizSetId);

  const hasData = data !== null;
  const revealed = data?.revealed ?? false;
  const countdown = useRevealCountdown(hasData && !revealed ? data.statsRevealAt : null);

  useEffect(() => {
    if (!hasData || revealed || !countdown.expired) return undefined;
    reload();
    const id = setInterval(reload, REVEAL_RECHECK_MS);
    return () => clearInterval(id);
  }, [hasData, revealed, countdown.expired, reload]);

  const title = data ? `${data.week}주차 퀴즈${data.revealed ? " 결과" : ""}` : "";

  return (
    <Page>
      <TopNavigation label={title} onBack={() => goBackOr(router, "/records")} />

      <Body>
        {!data && loading && <RecordDetailSkeleton />}
        {!data && !loading && (error || invalidId) && (
          <RecordsLoadError
            message="기록을 불러오지 못했어요."
            onRetry={invalidId ? undefined : reload}
          />
        )}

        {data && (
          <>
            <Padded>
              <RecordDetailHeaderCard
                record={data}
                countdownLabel={countdown.label}
                countdownExpired={countdown.expired}
              />
            </Padded>

            {data.revealed ? (
              <ListSlot>
                <RecordResultList questions={data.questions} />
              </ListSlot>
            ) : (
              <>
                {/* Figma 3254:38806 */}
                <Padded>
                  <LockNotice>
                    <LockIcon name="action.lockOutline" size={18} />
                    <span>
                      다른 사람들의 선택은 퀴즈가 끝난 뒤에 보여드려요. 미리 보면 답이 흔들릴 수
                      있거든요.
                    </span>
                  </LockNotice>
                </Padded>
                <ListSlot>
                  <RecordAnswerList questions={data.questions} />
                </ListSlot>
                <Footnote>제출한 답변은 바꿀 수 없어요</Footnote>
              </>
            )}
          </>
        )}
      </Body>

      <MainBottomNav />
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

/* 하단 탭(MainBottomNav)이 position: fixed 로 덮으므로 그만큼 비운다(ChatListPageClient 와 같은 값). */
const Body = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-1) 0 calc(72px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
`;

const Padded = styled.div`
  padding: 0 var(--space-4);
`;

/* 문항 카드는 시안에서 좌우 20px 이다(3254:37988 x=20). 머리 카드(16px)와 다르다. */
const ListSlot = styled.div`
  padding: 0 var(--space-5);
`;

const LockNotice = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-6px);
  margin: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const LockIcon = styled(Icon)`
  color: var(--color-semantic-primary-normal);
`;

const Footnote = styled.p`
  margin: 0;
  padding: 0 var(--space-4);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-neutral);
  text-align: center;
`;
