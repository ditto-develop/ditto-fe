"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { privacyPolicy } from "@/features/settings/model/policies";
import { getPolicyBackPath } from "@/features/settings/lib/policyNavigation";
import { PolicyDocument } from "@/features/settings/ui/PolicyDocument";
import { TopNavigation } from "@/shared/ui";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label={privacyPolicy.title} onBack={() => router.push(getPolicyBackPath())} />
      <Content>
        <PolicyDocument blocks={privacyPolicy.blocks} />
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
