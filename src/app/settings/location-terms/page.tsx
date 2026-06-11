"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { locationTerms } from "@/features/settings/model/policies";
import { PolicyDocument } from "@/features/settings/ui/PolicyDocument";
import { TopNavigation } from "@/shared/ui";

export default function LocationTermsPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label={locationTerms.title} onBack={() => router.push("/settings")} />
      <Content>
        <PolicyDocument blocks={locationTerms.blocks} />
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
