"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Step3Intro, type Step3Ref } from "@/components/onboarding/step/Step_3";
import { getMyIntroNoteAnswersByIndex } from "@/features/profile/api/profileApi";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";
import { saveExternalIntroNote } from "@/shared/lib/api/externalApi";
import { BottomActionArea, Button, TopNavigation } from "@/shared/ui";
import type { ControlButtonVariant, FormData, OnChange } from "@/types/type";

const EMPTY_FORM_DATA: FormData = {
    email: "",
    pic: "",
    nickname: "",
    gender: null,
    interest: [],
    place: null,
    job: null,
    birthDate: null,
    introduce: Array.from({ length: INTRO_NOTE_FIELDS.length }, () => ""),
};

export function EditIntroNoteContainer() {
    const router = useRouter();
    const stepRef = useRef<Step3Ref>(null);
    const [controlButton, setControlButton] = useState<ControlButtonVariant>("disabled");
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);
    /**
     * 저장된 답변을 받아오기 전에는 질문 목록을 그리지 않는다.
     * 답변 입력창은 마운트 시점의 값만 초기값으로 삼기 때문에, 빈 값으로 먼저 그려 두고
     * 나중에 답변을 채우면 진행 카드("N/10")만 바뀌고 입력창은 빈 채로 남았다 —
     * "다시 들어가면 답변이 다 지워져 있다"로 보이던 원인이다.
     */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // 답변 편집 중에는 하단 CTA를 감춘다 — position:fixed 라 키보드 위에 겹쳐
    // 입력창과 저장/취소 버튼을 가린다. 온보딩 소개 노트와 같은 처리다.
    const [editingAnswer, setEditingAnswer] = useState(false);

    useEffect(() => {
        let ignore = false;
        getMyIntroNoteAnswersByIndex()
            .then((answers) => {
                if (!ignore) setFormData((prev) => ({ ...prev, introduce: answers }));
            })
            .catch(() => undefined)
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, []);

    const handleChange: OnChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    /**
     * 저장은 "수정 완료"에서만 한다.
     *
     * 예전에는 질문별 저장 버튼이 곧바로 서버에 썼다. 그러면 최소 3개·필수 질문 조건과
     * 무관하게 답변이 하나씩 반영돼, 조건에 못 미치는 상태가 그대로 저장됐다.
     * 이제 조건을 통과해야만 서버에 쓰고, 통과하지 못하면 아무것도 바뀌지 않는다.
     */
    const handleSubmit = async () => {
        if (submitting) return;
        const canSubmit = stepRef.current?.handleSubmit() ?? false;
        if (!canSubmit) return;

        setSubmitting(true);
        try {
            const values = stepRef.current?.getCurrentValues() ?? formData.introduce;
            await Promise.all(
                INTRO_NOTE_FIELDS.map((field, index) => (
                    saveExternalIntroNote(field.code, values[index] ?? "")
                )),
            );
            router.push("/profile");
        } finally {
            setSubmitting(false);
        }
    };

    // 온보딩 "다 작성했어요"와 같은 정책: 조건 미달이면 비활성 모양이지만 눌러서 이유는 볼 수 있다.
    const looksDisabled = controlButton === "disabled" || submitting;

    return (
        <Page>
            <TopNavigation onBack={() => router.push("/profile")} />
            <Header>
                <Title>소개 노트 수정하기</Title>
                <Description>
                    대화 상대에게만 공개되는 나만의 소개 노트예요.
                    <br />
                    작성한 내용이 많을수록 더 진솔하게 다가갈 수 있어요.
                </Description>
            </Header>
            {!loading && (
                <>
                    <Body>
                        <Step3Intro
                            ref={stepRef}
                            data={formData}
                            onChange={handleChange}
                            setControlButton={setControlButton}
                            onEditingChange={setEditingAnswer}
                        />
                    </Body>
                    {!editingAnswer && (
                        <BottomActionArea>
                            <SubmitButton
                                type="button"
                                $variant="solid"
                                $size="large"
                                $looksDisabled={looksDisabled}
                                aria-disabled={looksDisabled}
                                onClick={handleSubmit}
                            >
                                수정 완료
                            </SubmitButton>
                        </BottomActionArea>
                    )}
                </>
            )}
        </Page>
    );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

/* 상단 내비게이션과 제목 사이는 제목과 설명 사이(--space-2)만큼만 띄운다. */
const Header = styled.header`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--typography-title-3-font-size);
  font-weight: var(--typography-title-3-font-weight);
  line-height: var(--typography-title-3-line-height);
  letter-spacing: var(--typography-title-3-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const Body = styled.main`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  box-sizing: border-box;
  padding: var(--space-8) var(--space-4) calc(var(--space-30) + env(safe-area-inset-bottom));
`;

/**
 * `disabled` 속성을 쓰지 않는다 — 클릭이 막히면 "필수 질문에 답해 주세요" 같은 이유를
 * 보여줄 수 없다. 온보딩 CTA(ActionButton variant="disabled")와 같은 방식이다.
 */
const SubmitButton = styled(Button)<{ $looksDisabled: boolean }>`
  width: 100%;

  ${({ $looksDisabled }) =>
    $looksDisabled &&
    `
    background-color: var(--color-semantic-interaction-disable);
    color: var(--color-semantic-label-disable);
    cursor: not-allowed;

    &:hover,
    &:active {
      background-color: var(--color-semantic-interaction-disable);
    }
  `}
`;
