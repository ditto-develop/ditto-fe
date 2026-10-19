"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { accountDeletionGuide } from "@/features/settings/model/policies";
import { PolicyDocument } from "@/features/settings/ui/PolicyDocument";
import { TopNavigation } from "@/shared/ui";

/**
 * 계정 삭제 안내. Google Play Console 의 **계정 삭제 URL** 로 제출하는 화면이다.
 *
 * 앱을 지운 사람도 열 수 있어야 하므로 비로그인 공개 경로이고(ClientLayout `isPublicDocPath`),
 * 브라우저 차단에서도 빠진다(`webGate.ts`). 뒤로가기는 고객 지원으로 간다 — 두 화면 모두 공개 경로라
 * 로그인 여부와 무관하게 튕기지 않는다.
 */
export default function DeleteAccountPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label={accountDeletionGuide.title} onBack={() => router.push("/support")} />
      <Content>
        <PolicyDocument blocks={accountDeletionGuide.blocks} />
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
