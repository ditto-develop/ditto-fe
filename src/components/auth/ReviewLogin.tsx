"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import styled from "styled-components";

import { useToast } from "@/context/ToastContext";
import { BottomSheet, Button, TextField } from "@/shared/ui";
import { loginWithExternalReviewAccount } from "@/shared/lib/api/externalApi";
import { describeError, hasApiErrorCode } from "@/shared/lib/api/apiError";
import { resolveSocialLogin } from "@/features/auth/lib/socialLoginOutcome";

/** 로고를 이만큼 연달아 누르면 심사용 로그인이 열린다. 심사 노트에 이 숫자를 적어 둔다. */
const TAP_COUNT = 5;
/** 탭 사이가 이보다 벌어지면 처음부터 다시 센다. */
const TAP_WINDOW_MS = 1500;

/** BE 가 값이 틀리거나 기능이 꺼져 있을 때 주는 코드(INVALID_REVIEW_LOGIN, BE ADR 0041). */
const INVALID_REVIEW_LOGIN = "1005";

/**
 * 로고 연타로 심사용 로그인을 여는 트리거.
 *
 * 일반 사용자에게 보일 이유가 없는 진입점이라 숨겨 둔다. 숨긴 기능은 App Store 심사 노트에
 * 진입 방법을 적어야 한다(가이드라인 2.3.1).
 */
export function useReviewLoginTrigger() {
  const [open, setOpen] = useState(false);
  const taps = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

  const onTap = () => {
    const now = Date.now();
    const continued = now - taps.current.last <= TAP_WINDOW_MS;
    taps.current = { count: continued ? taps.current.count + 1 : 1, last: now };

    if (taps.current.count >= TAP_COUNT) {
      taps.current = { count: 0, last: 0 };
      setOpen(true);
    }
  };

  return { open, onTap, close: () => setOpen(false) };
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const SubmitButton = styled(Button)`
  width: 100%;
`;

/**
 * App Store 심사용 데모 로그인 시트.
 *
 * 리뷰어는 카카오·애플 인증을 대신 통과할 수 없어서, BE 에 설정된 ID·비밀번호로 심사 계정에
 * 들어간다. 응답이 네이티브 소셜 로그인과 같으므로 결말 분기도 AppleLogin 과 같다.
 *
 * AppleLogin 과 달리 login_* 이벤트를 보내지 않는다 — 리뷰어의 로그인이 실사용자 로그인
 * 전환율에 섞이지 않게 하려는 의도다.
 */
export const ReviewLoginSheet = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const canSubmit = loginId.trim() !== "" && password !== "" && !pending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);

    try {
      const resolved = resolveSocialLogin(
        await loginWithExternalReviewAccount({ loginId: loginId.trim(), password }),
      );

      if (resolved.kind === "sanctioned") {
        router.replace(`/sanction?${resolved.query}`);
        return;
      }
      if (resolved.kind === "home") {
        router.push("/home");
        return;
      }
      // 신규 회원: 토큰은 이미 저장됐다. 가입 화면은 콜백 페이지가 담당한다(AppleLogin 과 같다).
      router.replace("/auth/callback?signupRequired=true");
    } catch (err: unknown) {
      if (hasApiErrorCode(err, INVALID_REVIEW_LOGIN)) {
        showToast("아이디 또는 비밀번호가 올바르지 않아요.", "error");
        return;
      }
      console.error("[ReviewLogin] 로그인 실패:", describeError(err));
      showToast("로그인 처리에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <BottomSheet
      title="심사용 로그인"
      subTitle="App Review 전용 계정으로 로그인합니다."
      closer={onClose}
      detail={
        <Form onSubmit={handleSubmit}>
          <TextField
            label="아이디"
            name="loginId"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <TextField
            label="비밀번호"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <SubmitButton type="submit" $size="large" disabled={!canSubmit}>
            {pending ? "로그인 중..." : "로그인"}
          </SubmitButton>
        </Form>
      }
    />
  );
};
