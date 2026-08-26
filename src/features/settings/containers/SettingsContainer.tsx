"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useToast } from "@/context/ToastContext";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { formatMaskedPhoneNumber } from "@/features/settings/lib/formatPhone";
import { SETTINGS_EXTERNAL_LINKS } from "@/features/settings/model/externalLinks";
import type { NotificationSettingKey } from "@/features/settings/model/types";
import { clearToken } from "@/shared/lib/api/client";
import { logoutExternal } from "@/shared/lib/api/externalApi";
import { WEB_APP_VERSION, getAppVersion } from "@/shared/lib/native/appVersion";
import { clearScheduledNotifications } from "@/shared/lib/native/localNotifications";
import { releasePushToken } from "@/shared/lib/native/pushNotifications";
import {
  ActionArea,
  ActionExtra,
  ActionTitle,
  AlertModal,
  Divider,
  Switch,
  TopNavigation,
} from "@/shared/ui";
import { useEffect, useState } from "react";

type RowConfig = {
  label: string;
  onClick: () => void;
};

const notificationRows: Array<{ key: NotificationSettingKey; label: string }> = [
  { key: "matching", label: "매칭 알림" },
  { key: "chat", label: "채팅 알림" },
  { key: "marketing", label: "마케팅 정보 수신" },
];

export function SettingsContainer() {
  const router = useRouter();
  const { showToast } = useToast();
  const { currentUser, notificationSettings, loading, error, updateSetting } = useSettings();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  // 네이티브 셸에서는 스토어 빌드 버전을, 웹에서는 기존 표시값을 그대로 쓴다.
  const [appVersion, setAppVersion] = useState(WEB_APP_VERSION);

  useEffect(() => {
    let alive = true;
    getAppVersion().then((version) => {
      if (alive) setAppVersion(version);
    });
    return () => {
      alive = false;
    };
  }, []);

  const showPreparingToast = () => {
    showToast("준비 중입니다.", "info");
  };

  /** 주소가 아직 없으면 빈 탭을 여는 대신 준비 중임을 알린다. */
  const openExternal = (url: string) => {
    if (!url) {
      showPreparingToast();
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const informationRows: RowConfig[] = [
    { label: "공지사항", onClick: () => openExternal(SETTINGS_EXTERNAL_LINKS.notice) },
    { label: "자주 묻는 질문", onClick: () => openExternal(SETTINGS_EXTERNAL_LINKS.faq) },
    { label: "서비스 이용약관", onClick: () => router.push("/settings/terms") },
    { label: "개인정보 처리방침", onClick: () => router.push("/settings/privacy") },
    { label: "위치기반 서비스 이용약관", onClick: () => router.push("/settings/location-terms") },
  ];

  const handleToggle = async (key: NotificationSettingKey, checked: boolean) => {
    const updated = await updateSetting(key, checked);
    if (!updated) showToast("알림 설정을 저장하지 못했어요.", "error");
  };

  const handleLogout = async () => {
    await logoutExternal().catch(() => null);
    // 예약된 로컬 알림을 지운다. 안 지우면 다른 계정으로 로그인해도, 심지어
    // 로그아웃 상태로 두어도 매칭 알림이 계속 울린다.
    await clearScheduledNotifications();
    // 원격 푸시도 끊는다. BE 연결 해제 + 기기 토큰 폐기.
    await releasePushToken();
    clearToken();
    setLogoutModalOpen(false);
    router.replace("/");
  };

  return (
    <Page>
      <TopNavigation label="설정" onBack={() => router.push("/profile")} />
      <Content>
        {loading && <StateText>설정을 불러오는 중...</StateText>}
        {error && <StateText>설정을 불러오지 못했어요.</StateText>}

        <Section>
          <SectionLabel>계정</SectionLabel>
          <StaticRow>
            <ActionTitle>이메일</ActionTitle>
            <ValueText>{currentUser?.email ?? "-"}</ValueText>
          </StaticRow>
          <StaticRow>
            <ActionTitle>휴대폰 번호</ActionTitle>
            <ValueText>{formatMaskedPhoneNumber(currentUser?.phoneNumber)}</ValueText>
          </StaticRow>
        </Section>

        <Divider />

        <Section>
          <SectionLabel>알림</SectionLabel>
          {notificationRows.map((row) => (
            <StaticRow key={row.key}>
              <ActionTitle>{row.label}</ActionTitle>
              <Switch
                aria-label={row.label}
                checked={Boolean(notificationSettings?.[row.key])}
                disabled={!notificationSettings}
                onCheckedChange={(checked) => handleToggle(row.key, checked)}
              />
            </StaticRow>
          ))}
        </Section>

        <Divider />

        <Section>
          <SectionLabel>개인정보</SectionLabel>
          <InteractiveRow onClick={() => router.push("/settings/blocks")}>
            <ActionTitle>차단 목록</ActionTitle>
            <ActionExtra>
              <Chevron aria-hidden="true" />
            </ActionExtra>
          </InteractiveRow>
        </Section>

        <Divider />

        <Section>
          <SectionLabel>정보</SectionLabel>
          {informationRows.map((row) => (
            <InteractiveRow key={row.label} onClick={row.onClick}>
              <ActionTitle>{row.label}</ActionTitle>
              <ActionExtra>
                <Chevron aria-hidden="true" />
              </ActionExtra>
            </InteractiveRow>
          ))}
          <StaticRow>
            <ActionTitle>앱 버전</ActionTitle>
            <ValueText>v{appVersion}</ValueText>
          </StaticRow>
        </Section>

        <Footer>
          <LogoutButton type="button" onClick={() => setLogoutModalOpen(true)}>
            로그아웃
          </LogoutButton>
          <WithdrawButton type="button" onClick={() => router.push("/settings/withdraw")}>
            회원탈퇴
          </WithdrawButton>
        </Footer>
      </Content>

      <AlertModal
        isOpen={logoutModalOpen}
        title="로그아웃"
        message="정말 로그아웃할까요?"
        onClose={() => setLogoutModalOpen(false)}
        cancelParams={{ text: "취소", onClick: () => setLogoutModalOpen(false) }}
        confirmParams={{ text: "확인", onClick: handleLogout }}
      />
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
  padding-bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  box-sizing: border-box;
`;

const Section = styled.section`
  padding: var(--space-4) 0;
`;

const SectionLabel = styled.h2`
  margin: 0;
  padding: 0 var(--space-5) var(--space-4);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const StaticRow = styled(ActionArea).attrs({ as: "div" })`
  box-sizing: border-box;
  cursor: default;

  &:active {
    background-color: var(--color-semantic-background-normal-normal);
  }
`;

const InteractiveRow = styled(ActionArea).attrs({ as: "button" })`
  box-sizing: border-box;
  border: 0;
  text-align: left;
  font: inherit;

  &:active {
    background-color: var(--color-semantic-background-normal-alternative);
  }
`;

const ValueText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const Chevron = styled(ChevronRight)`
  width: var(--space-5);
  height: var(--space-5);
  color: var(--color-semantic-label-alternative);
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4) 0;
`;

const FooterButton = styled.button`
  width: 100%;
  height: var(--space-12);
  box-sizing: border-box;
  border-radius: var(--radius-radi-4);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  cursor: pointer;
`;

const LogoutButton = styled(FooterButton)`
  border: 1px solid var(--color-semantic-status-negative);
  background-color: transparent;
  color: var(--color-semantic-status-negative);
`;

const WithdrawButton = styled(FooterButton)`
  border: 1px solid var(--color-semantic-line-normal-neutral);
  background-color: transparent;
  color: var(--color-semantic-label-alternative);
`;

const StateText = styled.p`
  margin: 0;
  padding: var(--space-4) var(--space-5);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
