"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { WITHDRAW_REASONS } from "@/features/settings/model/withdrawReasons";
import { clearToken } from "@/shared/lib/api/client";
import { leaveExternalUser } from "@/shared/lib/api/externalApi";
import { AlertModal, Select, TopNavigation } from "@/shared/ui";

type WithdrawStep = "notice" | "reason";
type ResultDialog = "success" | "failure" | null;

const noticeItems = [
  "진행 중인 매칭이나 채팅이 있으면 탈퇴가 제한됩니다.",
  "탈퇴 후 30일 이내 재가입하면 계정을 복구할 수 있습니다.",
  "30일이 지나면 모든 데이터가 완전히 삭제됩니다.",
];

export function WithdrawContainer() {
  const router = useRouter();
  const { profile, rawProfile } = useMyProfile();
  const [step, setStep] = useState<WithdrawStep>("notice");
  const [reason, setReason] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ResultDialog>(null);

  const profileReady = Boolean(profile?.nickname && rawProfile?.userId);
  const nickname = profile?.nickname ?? "";
  const selectedReason = useMemo(
    () => WITHDRAW_REASONS.find((item) => item.value === reason) ?? null,
    [reason],
  );

  const handleWithdraw = async () => {
    if (!rawProfile?.userId || !reason) return;

    try {
      await leaveExternalUser(rawProfile.userId, reason);
      setDialog("success");
    } catch {
      setDialog("failure");
    }
  };

  const handleSuccessClose = () => {
    clearToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    router.replace("/");
  };

  const handleCancel = () => {
    router.push("/settings");
  };

  return (
    <Page>
      <TopNavigation label="탈퇴하기" onClose={handleCancel} />
      <Content>
        {profileReady && step === "notice" ? (
          <StepContent>
            <Title>{nickname} 님, 잠깐만요!</Title>
            <NoticeBox>
              <NoticeTitle>탈퇴 전 확인해 주세요</NoticeTitle>
              <NoticeList>
                {noticeItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </NoticeList>
            </NoticeBox>
          </StepContent>
        ) : null}

        {profileReady && step === "reason" ? (
          <StepContent>
            <Title>{nickname} 님, 정말 떠나실 건가요?</Title>
            <Description>계정을 삭제하면 매칭 이력, 대화, 평가, 프로필이 모두 사라지고 복구할 수 없어요.</Description>
            <FieldGroup>
              <FieldLabel>탈퇴하려는 이유가 궁금해요.</FieldLabel>
              <Select
                value={reason}
                onChange={setReason}
                placeholder="사유를 선택해 주세요"
                bottomSheetTitle="탈퇴 사유"
                options={WITHDRAW_REASONS.map((item) => ({ label: item.label, value: item.value }))}
              />
              {selectedReason && <ReasonComment>{selectedReason.comment}</ReasonComment>}
            </FieldGroup>
          </StepContent>
        ) : null}
      </Content>

      {profileReady ? (
        <BottomActions>
          <CancelButton type="button" onClick={handleCancel}>
            취소
          </CancelButton>
          {step === "notice" ? (
            <PrimaryButton type="button" onClick={() => setStep("reason")}>
              확인
            </PrimaryButton>
          ) : (
            <PrimaryButton
              type="button"
              disabled={!reason || !rawProfile?.userId}
              onClick={handleWithdraw}
            >
              탈퇴하기
            </PrimaryButton>
          )}
        </BottomActions>
      ) : null}

      <AlertModal
        isOpen={dialog === "success"}
        title="탈퇴 완료"
        message="탈퇴 처리가 성공적으로 완료되었어요."
        confirmParams={{ text: "확인", onClick: handleSuccessClose }}
      />
      <AlertModal
        isOpen={dialog === "failure"}
        title="탈퇴 실패"
        message="진행 중인 매칭이 있어 탈퇴할 수 없습니다."
        onClose={() => setDialog(null)}
        confirmParams={{ text: "확인", onClick: () => setDialog(null) }}
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
  padding: var(--space-6) var(--space-4) calc(var(--space-28) + env(safe-area-inset-bottom));
  box-sizing: border-box;
`;

const StepContent = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const Title = styled.h1`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--typography-heading-1-font-size);
  font-weight: var(--typography-heading-1-font-weight);
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const Description = styled.p`
  margin: calc(var(--space-4) * -1) 0 var(--space-2);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const NoticeBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--color-semantic-line-normal-alternative);
  border-radius: var(--space-4);
  background-color: var(--color-semantic-fill-alternative);
`;

const NoticeTitle = styled.h2`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const NoticeList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding-left: var(--space-5);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const FieldLabel = styled.label`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const ReasonComment = styled.p`
  margin: 0;
  padding: var(--space-4);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-fill-alternative);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const BottomActions = styled.div`
  position: fixed;
  left: 50%;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;
  max-width: var(--space-max);
  padding: var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background-color: var(--color-semantic-background-normal-normal);
  transform: translateX(-50%);
`;

const ActionButton = styled.button`
  height: var(--space-12);
  box-sizing: border-box;
  border-radius: var(--radius-radi-4);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

const CancelButton = styled(ActionButton)`
  border: 1px solid var(--color-semantic-line-normal-neutral);
  background-color: transparent;
  color: var(--color-semantic-label-normal);
`;

const PrimaryButton = styled(ActionButton)`
  border: 0;
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);

  &:disabled {
    background-color: var(--color-semantic-interaction-disable);
    color: var(--color-semantic-label-assistive);
  }
`;
