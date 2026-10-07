"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { getPolicyBackPath } from "@/features/settings/lib/policyNavigation";
import { BUSINESS_INFO } from "@/shared/lib/businessInfo";
import { TopNavigation } from "@/shared/ui";

/**
 * 고객 지원. App Store Connect 의 **지원 URL**(`https://ditto.pics/support`)이 가리키는 화면이다.
 *
 * 심사 가이드라인 1.5 는 지원 URL 에서 바로 연락할 수 있어야 한다고 본다. 리뷰어가 링크로
 * 바로 들어오므로 비로그인 공개 경로다(ClientLayout `isPublicDocPath`).
 */
export default function SupportPage() {
  const router = useRouter();

  return (
    <Page>
      <TopNavigation label="고객 지원" onBack={() => router.push(getPolicyBackPath())} />
      <Content>
        <Intro>디토 이용 중 궁금한 점이나 불편한 점이 있으면 아래 이메일로 문의해 주세요.</Intro>
        <ContactList>
          <Label>이메일</Label>
          <Value>
            <MailLink href={`mailto:${BUSINESS_INFO.contactEmail}`}>{BUSINESS_INFO.contactEmail}</MailLink>
          </Value>
        </ContactList>
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Content = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-4) var(--space-5) var(--space-12);
  box-sizing: border-box;
`;

const Intro = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  word-break: keep-all;
`;

const ContactList = styled.dl`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
`;

const Label = styled.dt`
  margin: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const Value = styled.dd`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  overflow-wrap: anywhere;
`;

const MailLink = styled.a`
  color: inherit;
  text-decoration-line: underline;
`;
