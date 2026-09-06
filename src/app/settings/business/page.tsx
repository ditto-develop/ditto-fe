"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { getPolicyBackPath } from "@/features/settings/lib/policyNavigation";
import { BusinessInfoList } from "@/features/settings/ui/BusinessInfoList";
import { TopNavigation } from "@/shared/ui";

export default function BusinessInfoPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label="사업자 정보" onBack={() => router.push(getPolicyBackPath())} />
      <Content>
        <BusinessInfoList />
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
