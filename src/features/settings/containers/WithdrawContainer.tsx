"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { trackEvent } from "@/shared/lib/analytics";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { WITHDRAW_REASONS } from "@/features/settings/model/withdrawReasons";
import { API_ERROR_CODE, hasApiErrorCode } from "@/shared/lib/api/apiError";
import { clearToken } from "@/shared/lib/api/client";
import { leaveExternalUser } from "@/shared/lib/api/externalApi";
import { clearTokens } from "@/shared/lib/auth";
import { registerDeviceToken, releasePushToken } from "@/shared/lib/native/pushNotifications";
import { AlertModal, Select, TopNavigation } from "@/shared/ui";

type WithdrawStep = "notice" | "reason";
type ResultDialog = "success" | "failure" | null;

/**
 * 탈퇴 실패 문구.
 *
 * 6011은 원인이 셋(남은 1:1 매칭 / 끝나지 않은 채팅방 / 재매칭 성사 후 방 미생성)인데
 * 코드도 메시지도 같아 서버 응답만으로는 가릴 수 없다. 세 번째는 보통 1분 안에 풀리지만
 * 상대가 좁은 경쟁 구간에서 탈퇴한 쌍이면 스스로 풀리지 않으므로,
 * 무한 재시도 대신 몇 번 실패하면 문의로 안내한다.
 */
const LEAVE_RETRY_LIMIT = 3;

const FAILURE_MESSAGE = {
  leaveBlocked:
    "진행 중인 매칭이나 채팅이 있어 탈퇴할 수 없어요. 정리한 뒤 잠시 후 다시 시도해 주세요.",
  leaveBlockedExhausted:
    "탈퇴 처리가 계속 막히고 있어요. 진행 중인 매칭·채팅을 정리했는데도 반복된다면 고객센터로 문의해 주세요.",
  unknown: "탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;

/** BE 상한과 같다. 초과분은 서버가 거절하므로 입력 단계에서 막는다. */
const REASON_DETAIL_MAX_LENGTH = 100;

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
  const [reasonDetail, setReasonDetail] = useState("");
  const [dialog, setDialog] = useState<ResultDialog>(null);
  const [failureMessage, setFailureMessage] = useState<string>(FAILURE_MESSAGE.unknown);
  const [blockedAttempts, setBlockedAttempts] = useState(0);

  const profileReady = Boolean(profile?.nickname && rawProfile?.userId);
  const nickname = profile?.nickname ?? "";
  const selectedReason = useMemo(
    () => WITHDRAW_REASONS.find((item) => item.value === reason) ?? null,
    [reason],
  );

  const handleWithdraw = async () => {
    if (!rawProfile?.userId || !reason) return;

    /**
     * 푸시는 **탈퇴 요청 전에** 끊어야 한다. 탈퇴가 끝나면 보유 토큰이 전부 무효(6012)라
     * 해제 API를 부를 수 없고, 그러면 BE에 남은 디바이스 토큰으로 이 기기에 계속
     * 알림이 간다(BE 위키 Frontend-Push-Guide §2).
     */
    await releasePushToken();

    try {
      await leaveExternalUser(rawProfile.userId, reason, reasonDetail.trim() || undefined);
      // 사유는 정해진 선택지 값만 싣는다. 자유 입력(reasonDetail)은 절대 보내지 않는다.
      trackEvent("withdraw_complete", { reason });
      setDialog("success");
    } catch (err: unknown) {
      // 탈퇴가 막히면(6011 등) 사용자는 로그인 상태로 남는다. 방금 끊은 푸시를 되돌린다.
      void registerDeviceToken();

      if (hasApiErrorCode(err, API_ERROR_CODE.LEAVE_BLOCKED)) {
        const attempts = blockedAttempts + 1;
        setBlockedAttempts(attempts);
        setFailureMessage(
          attempts >= LEAVE_RETRY_LIMIT
            ? FAILURE_MESSAGE.leaveBlockedExhausted
            : FAILURE_MESSAGE.leaveBlocked,
        );
      } else {
        setFailureMessage(FAILURE_MESSAGE.unknown);
      }
      setDialog("failure");
    }
  };

  // 탈퇴 후에는 보유 토큰이 모두 무효(6012)다. 세션을 지우고 첫 화면으로 보낸다.
  const handleSuccessClose = () => {
    clearToken();
    clearTokens();
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
            <FieldGroup>
              {/* 선택 입력이다. '기타'가 아니어도 BE가 받는다. */}
              <FieldLabel>더 하고 싶은 말이 있다면 남겨 주세요. (선택)</FieldLabel>
              <ReasonDetailInput
                value={reasonDetail}
                onChange={(event) => setReasonDetail(event.target.value)}
                placeholder="자유롭게 적어 주세요"
                maxLength={REASON_DETAIL_MAX_LENGTH}
                rows={3}
              />
              <ReasonDetailCount>
                {reasonDetail.length}/{REASON_DETAIL_MAX_LENGTH}
              </ReasonDetailCount>
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
            <PrimaryButton type="button" onClick={() => {
              // 사유 화면까지 간 사람. 실제 탈퇴보다 훨씬 많아야 정상이고,
              // 둘의 차이가 작으면 안내 화면이 제 역할을 못 하고 있다는 뜻이다.
              trackEvent("withdraw_start", {});
              setStep("reason");
            }}>
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
        message={failureMessage}
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

const ReasonDetailInput = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-4);
  border: 1px solid var(--color-semantic-line-normal-normal);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-normal-normal);
  resize: none;
  font-family: inherit;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);

  &::placeholder {
    color: var(--color-semantic-label-assistive);
  }

  &:focus {
    outline: none;
    border-color: var(--color-semantic-primary-normal);
  }
`;

const ReasonDetailCount = styled.span`
  align-self: flex-end;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-assistive);
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
