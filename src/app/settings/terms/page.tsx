"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { termsOfService } from "@/features/settings/model/policies";
import { getPolicyBackPath } from "@/features/settings/lib/policyNavigation";
import { PolicyDocument } from "@/features/settings/ui/PolicyDocument";
import { TopNavigation } from "@/shared/ui";

export default function TermsPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label={termsOfService.title} onBack={() => router.push(getPolicyBackPath())} />
      <Content>
        <PolicyDocument blocks={termsOfService.blocks} />
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
