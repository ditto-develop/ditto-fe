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
    name: "",
    phone: "",
    code: "",
    email: "",
    pic: "",
    nickname: "",
    gender: null,
    age: null,
    interest: [],
    place: null,
    job: null,
    birthDate: null,
    introduce: Array.from({ length: INTRO_NOTE_FIELDS.length }, () => ""),
};

export function EditIntroNoteContainer() {
    const router = useRouter();
    const stepRef = useRef<Step3Ref>(null);
    const [, setControlButton] = useState<ControlButtonVariant>("primary");
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getMyIntroNoteAnswersByIndex().then((answers) => {
            setFormData((prev) => ({ ...prev, introduce: answers }));
        });
    }, []);

    const handleChange: OnChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

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
            <Body>
                <Step3Intro
                    ref={stepRef}
                    data={formData}
                    onChange={handleChange}
                    setControlButton={setControlButton}
                    onPersist={saveExternalIntroNote}
                />
            </Body>
            <BottomActionArea>
                <SubmitButton
                    type="button"
                    $variant="solid"
                    $size="large"
                    onClick={handleSubmit}
                >
                    수정 완료
                </SubmitButton>
            </BottomActionArea>
        </Page>
    );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Header = styled.header`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  box-sizing: border-box;
  padding: var(--space-4) var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-10px);
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

const SubmitButton = styled(Button)`
  width: 100%;
`;
