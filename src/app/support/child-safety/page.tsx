"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { childSafetyStandards } from "@/features/settings/model/policies";
import { PolicyDocument } from "@/features/settings/ui/PolicyDocument";
import { TopNavigation } from "@/shared/ui";

/**
 * 아동 안전 기준. Google Play Console 의 **아동 안전 표준 URL** 로 제출하는 화면이다.
 *
 * Play 는 이 기준이 앱 밖에서 누구나 열 수 있게 공개돼 있어야 한다고 보므로 비로그인 공개 경로이고
 * (ClientLayout `isPublicDocPath`), 브라우저 차단에서도 빠진다(`webGate.ts`). 뒤로가기는 고객 지원으로 간다.
 */
export default function ChildSafetyPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label={childSafetyStandards.title} onBack={() => router.push("/support")} />
      <Content>
        <PolicyDocument blocks={childSafetyStandards.blocks} />
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Content = styled.main`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
`;
