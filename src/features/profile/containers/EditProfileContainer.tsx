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
import { ProfileSelect, toAvatarGender } from "@/components/onboarding/ProfileSelect";
import { interestOptions } from "@/components/onboarding/step/Step_2";
import { useToast } from "@/context/ToastContext";
import { getMyProfile, updateMyProfile } from "@/features/profile/api/profileApi";
import type { PublicProfileDto, UpdateMyProfileRequest } from "@/features/profile/api/profileApi";
import { describeError, isApiError } from "@/shared/lib/api/apiError";
import { checkExternalNicknameAvailability } from "@/shared/lib/api/externalApi";
import { getNicknameRuleErrors } from "@/shared/lib/nicknameSafety";
import { LOCATION_LABELS, OCCUPATION_LABELS } from "@/shared/lib/profileLabels";
import { BottomActionArea, Button, Select, TextField, TopNavigation } from "@/shared/ui";

const MAX_INTEREST_COUNT = 5;

const LOCATION_OPTIONS = Object.entries(LOCATION_LABELS).map(([value, label]) => ({ value, label }));
const OCCUPATION_OPTIONS = Object.entries(OCCUPATION_LABELS).map(([value, label]) => ({ value, label }));

/** 닉네임 변경 정책(2026-09-27). 서버가 검증하고, 화면은 미리 알려 주기만 한다. */
const NICKNAME_POLICY_MESSAGE = "닉네임은 14일 동안 최대 2번 바꿀 수 있어요. 대화 중에는 바꿀 수 없어요.";

/**
 * 프로필 수정 — Figma 6.1.1 프로필 수정.
 *
 * 편집 가능한 것은 캐리커쳐·닉네임·관심사·사는 곳·직업이다(2026-09-27 QA — BE PATCH 가
 * nickname/location/occupation 을 받게 됐다). 성별·나이는 매칭 조건이라 읽기 전용으로 둔다.
 * 닉네임은 바뀐 경우에만 보낸다 — 같은 값을 보내도 서버가 변경 횟수로 셀 수 있다.
 * 한 줄 소개는 이 화면에 없다 — BE 가 소개 노트 Q10("나를 한 줄로 표현한다면?")과 같은 값으로
 * 다루므로 소개 노트 수정 화면에서만 고친다. 여기 두면 같은 값을 고치는 입구가 둘이 된다.
 */
export function EditProfileContainer() {
    const router = useRouter();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<PublicProfileDto | null>(null);
    const [profileId, setProfileId] = useState("m1");
    const [interests, setInterests] = useState<string[]>([]);
    const [nickname, setNickname] = useState("");
    const [nicknameErrors, setNicknameErrors] = useState<string[]>([]);
    const [location, setLocation] = useState<string | null>(null);
    const [occupation, setOccupation] = useState<string | null>(null);
    const [isProfileSelectOpen, setIsProfileSelectOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getMyProfile().then((dto) => {
            setProfile(dto);
            setInterests(dto.interests ?? []);
            setNickname(dto.nickname);
            setLocation(dto.location ?? null);
            setOccupation(dto.occupation ?? null);
            setProfileId(toAvatarId(dto.profileImageUrl, dto.gender));
        });
    }, []);

    const avatarUrl = useMemo(() => `/assets/avatar/${profileId}.png`, [profileId]);
    const trimmedNickname = nickname.trim();
    const nicknameChanged = Boolean(profile) && trimmedNickname !== profile?.nickname;
    const isValid = interests.length > 0 && trimmedNickname.length > 0 && Boolean(location) && Boolean(occupation);
    const isDirty = Boolean(profile) && (
        avatarUrl !== (profile?.profileImageUrl ?? "") ||
        interests.join("|") !== (profile?.interests ?? []).join("|") ||
        nicknameChanged ||
        location !== (profile?.location ?? null) ||
        occupation !== (profile?.occupation ?? null)
    );
    const canSubmit = isDirty && isValid && !submitting;

    // 프로필이 오기 전에는 성별을 몰라 어느 캐리커쳐 목록을 보여줄지 정할 수 없다.
    const openProfileSelect = () => {
        if (!profile) return;
        setIsProfileSelectOpen(true);
    };

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
        if (interests.length === 0) {
            showToast("관심사를 1개 이상 선택해주세요.", "error");
            return;
        }
        if (nicknameChanged) {
            const ruleErrors = getNicknameRuleErrors(trimmedNickname);
            setNicknameErrors(ruleErrors);
            if (ruleErrors.length > 0) return;
        }

        setSubmitting(true);
        try {
            if (nicknameChanged) {
                const availability = await checkExternalNicknameAvailability(trimmedNickname);
                if (availability.available === false) {
                    setNicknameErrors(["· 이미 사용 중인 닉네임이에요."]);
                    return;
                }
            }

            const body: UpdateMyProfileRequest = {
                profileImageUrl: avatarUrl,
                interests,
                location: location ?? undefined,
                occupation: occupation ?? undefined,
            };
            if (nicknameChanged) body.nickname = trimmedNickname;

            await updateMyProfile(body);
            showToast("프로필이 저장되었어요.", "success");
            router.push("/profile");
        } catch (err: unknown) {
            console.error("Profile update failed:", describeError(err));
            // 닉네임 변경 제한(14일 2회·대화 중)은 서버가 거절한다. 전용 코드가 정해지기 전까지는
            // 서버 문구를 그대로 보여 준다(docs/be-request-qa-2026-09-27.md §3).
            showToast(
                isApiError(err) && err.code && err.message
                    ? err.message
                    : "프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
                "error",
            );
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
                // 성별은 이 화면에서 못 바꾼다 — 캐리커쳐도 계정 성별 목록에 고정된다.
                gender={toAvatarGender(profile?.gender)}
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

                <TextField
                    label="닉네임"
                    isessential
                    placeholder="사용할 닉네임을 입력해주세요"
                    maxLength={10}
                    status={nicknameErrors.length > 0 ? "error" : "default"}
                    errmessage={nicknameErrors}
                    message={nicknameErrors.length > 0 ? undefined : NICKNAME_POLICY_MESSAGE}
                    value={nickname}
                    onChange={(event) => {
                        setNickname(event.target.value);
                        if (nicknameErrors.length > 0) setNicknameErrors([]);
                    }}
                />

                <TwoColumnRow>
                    <ReadOnlyField label="성별" value={toGenderLabel(profile?.gender)} hasChevron />
                    <ReadOnlyField label="나이" value={toAgeSelectLabel(profile?.age)} hasChevron />
                </TwoColumnRow>

                <FieldGroup>
                    <InterestHeader>
                        <FieldLabelText>관심사</FieldLabelText>
                        <InterestCount>{interests.length}/{MAX_INTEREST_COUNT}</InterestCount>
                        <RequiredMark>*</RequiredMark>
                    </InterestHeader>
                    <InterestGrid>
                        {interestOptions.map((option) => (
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

                <Select
                    label="사는 곳"
                    isessential
                    bottomSheetTitle="사는 곳"
                    value={location}
                    onChange={setLocation}
                    options={LOCATION_OPTIONS}
                />
                <Select
                    label="직업"
                    isessential
                    bottomSheetTitle="직업"
                    value={occupation}
                    onChange={setOccupation}
                    options={OCCUPATION_OPTIONS}
                />
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
