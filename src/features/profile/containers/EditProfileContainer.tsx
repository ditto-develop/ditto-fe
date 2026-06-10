"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import styled from "styled-components";
import {
    ProfileEdit,
    ProfileImg,
    ProfileWrapper,
} from "@/components/onboarding/OnboardingContainer";
import { ProfileSelect } from "@/components/onboarding/ProfileSelect";
import { interestOptions } from "@/components/onboarding/step/Step_2";
import { useToast } from "@/context/ToastContext";
import { getMyProfile, updateMyProfile } from "@/features/profile/api/profileApi";
import type { PublicProfileDto } from "@/features/profile/api/profileApi";
import { toLocationLabel, toOccupationLabel } from "@/shared/lib/profileLabels";
import { BottomActionArea, Button, TopNavigation } from "@/shared/ui";

const INTRODUCTION_MAX_LENGTH = 50;
const MAX_INTEREST_COUNT = 5;

const profileInterestOptions = [
    { label: "💪 운동", value: "workout" },
    { label: "🍿 영화/드라마", value: "movie-drama" },
    { label: "🖼️ 전시", value: "exhibition" },
    ...interestOptions.filter((option) => !["workout", "movie-drama"].includes(option.value)),
];

export function EditProfileContainer() {
    const router = useRouter();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<PublicProfileDto | null>(null);
    const [profileId, setProfileId] = useState("m1");
    const [introduction, setIntroduction] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [isProfileSelectOpen, setIsProfileSelectOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showIntroductionError, setShowIntroductionError] = useState(false);

    useEffect(() => {
        getMyProfile().then((dto) => {
            setProfile(dto);
            setIntroduction(dto.introduction ?? "");
            setInterests(dto.interests ?? []);
            setProfileId(toAvatarId(dto.profileImageUrl, dto.gender));
        });
    }, []);

    const avatarUrl = useMemo(() => `/assets/avatar/${profileId}.png`, [profileId]);
    const isValid = introduction.trim().length > 0 && interests.length > 0;
    const isDirty = Boolean(profile) && (
        introduction !== (profile?.introduction ?? "") ||
        avatarUrl !== (profile?.profileImageUrl ?? "") ||
        interests.join("|") !== (profile?.interests ?? []).join("|")
    );
    const canSubmit = isDirty && isValid && !submitting;

    const openProfileSelect = () => setIsProfileSelectOpen(true);

    const handleProfileEditKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openProfileSelect();
    };

    const handleToggleInterest = (value: string) => {
        setInterests((prev) => (
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : prev.length >= MAX_INTEREST_COUNT
                    ? prev
                    : [...prev, value]
        ));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (!introduction.trim()) {
            setShowIntroductionError(true);
            showToast("필수 항목을 작성해 주세요.", "error");
            return;
        }
        if (interests.length === 0) {
            showToast("관심사를 1개 이상 선택해주세요.", "error");
            return;
        }

        setSubmitting(true);
        try {
            await updateMyProfile({
                introduction: introduction.trim(),
                profileImageUrl: avatarUrl,
                interests,
            });
            showToast("프로필이 저장되었어요.", "success");
            router.push("/profile");
        } finally {
            setSubmitting(false);
        }
    };

    if (isProfileSelectOpen) {
        return (
            <ProfileSelect
                profile={profileId}
                setProfile={setProfileId}
                setProfileModal={setIsProfileSelectOpen}
            />
        );
    }

    return (
        <Page>
            <TopNavigation label="프로필 수정" onBack={() => router.push("/profile")} />
            <FormArea>
                <AvatarSection>
                    <ProfileWrapper>
                        <ProfileImg imageUrl={avatarUrl} />
                        <AvatarEditIcon
                            role="button"
                            tabIndex={0}
                            aria-label="프로필 이미지 수정"
                            onClick={openProfileSelect}
                            onKeyDown={handleProfileEditKeyDown}
                        />
                    </ProfileWrapper>
                </AvatarSection>

                <ReadOnlyField label="닉네임" value={profile?.nickname ?? ""} />

                <TwoColumnRow>
                    <ReadOnlyField label="성별" value={toGenderLabel(profile?.gender)} hasChevron />
                    <ReadOnlyField label="나이" value={toAgeSelectLabel(profile?.age)} hasChevron />
                </TwoColumnRow>

                <TextAreaField>
                    <FieldLabel>
                        한 줄 소개
                        <RequiredMark>*</RequiredMark>
                    </FieldLabel>
                    <IntroductionBox
                        value={introduction}
                        maxLength={INTRODUCTION_MAX_LENGTH}
                        onBlur={() => setShowIntroductionError(introduction.trim().length === 0)}
                        onChange={(event) => {
                            setIntroduction(event.target.value);
                            if (event.target.value.trim().length > 0) {
                                setShowIntroductionError(false);
                            }
                        }}
                    />
                    <CountText>{introduction.length}/{INTRODUCTION_MAX_LENGTH}</CountText>
                    {showIntroductionError && (
                        <ErrorText>필수 항목을 작성해 주세요.</ErrorText>
                    )}
                </TextAreaField>

                <FieldGroup>
                    <InterestHeader>
                        <FieldLabelText>관심사</FieldLabelText>
                        <InterestCount>{interests.length}/{MAX_INTEREST_COUNT}</InterestCount>
                        <RequiredMark>*</RequiredMark>
                    </InterestHeader>
                    <InterestGrid>
                        {profileInterestOptions.map((option) => (
                            <InterestChip
                                type="button"
                                key={option.value}
                                $selected={interests.includes(option.value)}
                                disabled={!interests.includes(option.value) && interests.length >= MAX_INTEREST_COUNT}
                                onClick={() => handleToggleInterest(option.value)}
                            >
                                {option.label}
                            </InterestChip>
                        ))}
                    </InterestGrid>
                </FieldGroup>

                <ReadOnlyField label="사는 곳" value={profile?.location ? toLocationLabel(profile.location) : ""} hasChevron />
                <ReadOnlyField label="직업" value={profile?.occupation ? toOccupationLabel(profile.occupation) : ""} hasChevron />
            </FormArea>

            <BottomActionArea>
                <SaveButton
                    type="button"
                    $variant="solid"
                    $size="large"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    저장
                </SaveButton>
            </BottomActionArea>
        </Page>
    );
}

function ReadOnlyField({ label, value, hasChevron = false }: { label: string; value: string; hasChevron?: boolean }) {
    return (
        <FieldGroup>
            <FieldLabel>
                {label}
                <RequiredMark>*</RequiredMark>
            </FieldLabel>
            <DisabledField>
                <DisabledValue>{value}</DisabledValue>
                {hasChevron && <ChevronIcon aria-hidden="true" />}
            </DisabledField>
        </FieldGroup>
    );
}

function toAvatarId(profileImageUrl: string | undefined, gender: string): string {
    const match = profileImageUrl?.match(/\/([^/.]+)\.png$/);
    if (match?.[1]) return match[1];
    return gender === "FEMALE" ? "f1" : "m1";
}

function toGenderLabel(gender: string | undefined): string {
    if (gender === "MALE") return "남자";
    if (gender === "FEMALE") return "여자";
    return "";
}

function toAgeSelectLabel(age: number | undefined): string {
    if (!age) return "";
    if (age >= 60) return "60 이상";
    if (age >= 50) return "50~59";
    if (age >= 45) return "45~49";
    if (age >= 40) return "40~44";
    if (age >= 35) return "35~39";
    if (age >= 30) return "30~34";
    if (age >= 25) return "25~29";
    return "20~24";
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const FormArea = styled.main`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  box-sizing: border-box;
  padding: var(--space-4) var(--space-5) calc(var(--space-30) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const AvatarSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AvatarEditIcon = styled(ProfileEdit)`
  cursor: pointer;
`;

const FieldGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

const FieldLabel = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const FieldLabelText = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const TwoColumnRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6);
  width: 100%;
`;

const DisabledField = styled.div`
  min-height: var(--space-12);
  box-sizing: border-box;
  padding: var(--space-3);
  border-radius: var(--space-3);
  border: var(--spacing-1px) solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-interaction-disable);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

const DisabledValue = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const ChevronIcon = styled(ChevronDown)`
  width: var(--space-4);
  height: var(--space-4);
  color: var(--color-semantic-label-disable);
  flex: 0 0 auto;
`;

const TextAreaField = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

const IntroductionBox = styled.textarea`
  width: 100%;
  min-height: var(--space-20);
  box-sizing: border-box;
  resize: none;
  border-radius: var(--space-3);
  border: var(--spacing-1px) solid var(--color-semantic-line-normal-neutral);
  background-color: transparent;
  padding: var(--space-3) var(--space-4) var(--space-10);
  outline: none;
  font-size: var(--typography-body-1-reading-font-size);
  font-weight: var(--typography-body-1-reading-font-weight);
  line-height: var(--typography-body-1-reading-line-height);
  letter-spacing: var(--typography-body-1-reading-letter-spacing);
  color: var(--color-semantic-label-normal);

  &:focus {
    border-color: var(--color-semantic-line-normal-strong);
  }
`;

const CountText = styled.span`
  position: absolute;
  left: var(--space-4);
  bottom: var(--space-3);
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-status-negative);
`;

const InterestHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const RequiredMark = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-status-negative);
`;

const InterestCount = styled.span`
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const InterestGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const InterestChip = styled.button<{ $selected: boolean }>`
  min-height: var(--space-10);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--spacing-10px);
  background-color: ${({ $selected }) =>
    $selected
      ? "var(--color-semantic-primary-strong)"
      : "var(--color-semantic-fill-alternative)"};
  color: ${({ $selected }) =>
    $selected
      ? "var(--color-semantic-inverse-label)"
      : "var(--color-semantic-label-alternative)"};
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);

  &:disabled {
    cursor: default;
    color: var(--color-semantic-label-disable);
  }
`;

const SaveButton = styled(Button)`
  width: 100%;
`;
