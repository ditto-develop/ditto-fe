"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

import { MainBottomNav } from "@/app/home/MainBottomNav";
import { useQuizRecords } from "@/features/records/hooks/useQuizRecords";
import { PastRecordCard } from "@/features/records/ui/PastRecordCard";
import { RecordSummaryTiles } from "@/features/records/ui/RecordSummaryTiles";
import { RecordsLoadError, RecordsTabSkeleton } from "@/features/records/ui/RecordsStates";
import { ThisWeekRecordCard } from "@/features/records/ui/ThisWeekRecordCard";
import { EmptyState } from "@/shared/ui";

/**
 * 8.1 기록 탭 [3254:37041] — 상단 요약 3칸, 이번 주 카드, 지난 퀴즈 목록.
 *
 * 공개 전 기능이라 라우트(`/records`)에서 서버 `RECORDS` 플래그로 막고 들어온다(CLAUDE.md §9.1).
 * 목록은 서버가 최신 주부터 주고, 맨 위 카드는 서버의 `currentWeek` 가 가리키는 주다 —
 * 운영 주의 경계(월 00:00)를 FE 시계로 판정하지 않는다.
 */
export function QuizRecordsContainer() {
  const router = useRouter();
  const { data, loading, error, reload } = useQuizRecords();

  const openRecord = (quizSetId: number) => router.push(`/records/${quizSetId}`);

  const currentWeek = data?.currentWeek ?? null;
  const current = currentWeek
    ? (data?.weeks.find((week) => week.quizSetId === currentWeek.quizSetId) ?? null)
    : null;
  const past = data?.weeks.filter((week) => week.quizSetId !== currentWeek?.quizSetId) ?? [];

  return (
    <Page>
      <Header>
        <Title>퀴즈 기록</Title>
      </Header>

      <Body>
        {!data && loading && <RecordsTabSkeleton />}
        {!data && !loading && error && (
          <RecordsLoadError message="기록을 불러오지 못했어요." onRetry={reload} />
        )}

        {data && (
          <>
            <Top>
              <RecordSummaryTiles summary={data.summary} />
              {current && currentWeek && (
                <ThisWeekRecordCard record={current} currentWeek={currentWeek} onOpen={openRecord} />
              )}
            </Top>

            {data.weeks.length === 0 && (
              <EmptySlot>
                <EmptyState
                  icon="content.documentText"
                  title="아직 기록이 없어요"
                  description="퀴즈를 끝까지 풀면 여기에 내 답이 쌓여요."
                />
              </EmptySlot>
            )}

            {past.length > 0 && (
              <PastSection aria-labelledby="records-past-heading">
                <SectionHeading id="records-past-heading">지난 퀴즈</SectionHeading>
                <PastList>
                  {past.map((record) => (
                    <PastRecordCard key={record.quizSetId} record={record} onOpen={openRecord} />
                  ))}
                </PastList>
              </PastSection>
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

/* Figma Top Navigation(3254:37043) — 뒤로 버튼 없이 제목만 왼쪽에 둔다. 공용 TopNavigation 의
   왼쪽 정렬은 숨긴 뒤로 버튼 자리(24px)만큼 밀려 시안과 어긋나 따로 둔다. */
const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: calc(var(--space-14) + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) var(--space-4) 0;
  box-sizing: border-box;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--typography-heading-1-font-size);
  font-weight: var(--typography-heading-1-font-weight);
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

/* 하단 탭(MainBottomNav)이 position: fixed 로 덮으므로 그만큼 비운다(ChatListPageClient 와 같은 값). */
const Body = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-1) 0 calc(72px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 0 var(--space-4);
`;

const EmptySlot = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
`;

/* 지난 퀴즈는 시안에서 좌우 20px 이다(Contents 3254:37728 — margin/content). 위 카드(16px)와 다르다. */
const PastSection = styled.section`
  display: flex;
  flex-direction: column;
`;

const SectionHeading = styled.h2`
  margin: 0;
  padding: 0 var(--space-5);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const PastList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
`;
