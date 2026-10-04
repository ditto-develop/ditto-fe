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
import { API_ERROR_CODE, describeError, getApiErrorCode } from "@/shared/lib/api/apiError";
import { checkExternalNicknameAvailability, getExternalCurrentUser } from "@/shared/lib/api/externalApi";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";
import { getNicknameRuleErrors } from "@/shared/lib/nicknameSafety";
import { LOCATION_LABELS, OCCUPATION_LABELS } from "@/shared/lib/profileLabels";
import { BottomActionArea, Button, Select, TextField, TopNavigation } from "@/shared/ui";

const MAX_INTEREST_COUNT = 5;

const LOCATION_OPTIONS = Object.entries(LOCATION_LABELS).map(([value, label]) => ({ value, label }));
const OCCUPATION_OPTIONS = Object.entries(OCCUPATION_LABELS).map(([value, label]) => ({ value, label }));

/**
 * 닉네임 변경 정책: 2회 바꾸면 14일 잠금, 끝나지 않은 채팅방이 있으면 불가.
 * 서버가 검증한다(3004·3005). 화면은 남은 횟수와 잠금 해제일을 미리 알려 준다
 * (BE 위키 Frontend-QA-Fixes-Guide §2).
 */
const NICKNAME_POLICY_MESSAGE = "닉네임은 14일 동안 최대 2번 바꿀 수 있어요. 대화 중에는 바꿀 수 없어요.";
const NICKNAME_TAKEN_MESSAGE = "· 이미 사용 중인 닉네임이에요.";
const NICKNAME_IN_CHAT_MESSAGE = "· 대화 중에는 닉네임을 바꿀 수 없어요.";

type NicknameChangeQuota = {
    /** null 이면 서버가 아직 내려주지 않음 — 막지 않고 안내만 한다. */
    remaining: number | null;
    lockedUntil: string | null;
};

/** "10월 11일부터 다시 바꿀 수 있어요." 해제 시각을 모르면 날짜 없이 안내한다. */
function toLockedMessage(lockedUntil: string | null): string {
    const date = parseServerDateTime(lockedUntil);
    if (!date) return "닉네임 변경 횟수를 모두 사용했어요. 14일 뒤에 다시 바꿀 수 있어요.";
    return `${date.getMonth() + 1}월 ${date.getDate()}일부터 다시 바꿀 수 있어요.`;
}

function toNicknameHelper(quota: NicknameChangeQuota): string {
    if (quota.remaining === null) return NICKNAME_POLICY_MESSAGE;
    if (quota.remaining <= 0) return toLockedMessage(quota.lockedUntil);
    return `남은 변경 ${quota.remaining}회 · ${NICKNAME_POLICY_MESSAGE}`;
}

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
    const [nicknameQuota, setNicknameQuota] = useState<NicknameChangeQuota>({ remaining: null, lockedUntil: null });
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
        // 남은 변경 횟수는 프로필이 아니라 내 정보에 있다. 실패해도 편집은 막지 않는다 — 서버가 최종 판정한다.
        getExternalCurrentUser()
            .then((me) => setNicknameQuota({
                remaining: me.nicknameChangeRemaining,
                lockedUntil: me.nicknameChangeLockedUntil,
            }))
            .catch(() => undefined);
    }, []);

    const nicknameLocked = nicknameQuota.remaining !== null && nicknameQuota.remaining <= 0;

    const avatarUrl = useMemo(() => `/assets/avatar/${profileId}.webp`, [profileId]);
    const trimmedNickname = nickname.trim();
    const nicknameChanged = Boolean(profile) && trimmedNickname !== profile?.nickname;
    const isValid = interests.length > 0 && trimmedNickname.length > 0 && Boolean(location) && Boolean(occupation);
    // URL 이 아니라 아바타 ID 로 비교한다. 저장된 URL 은 확장자가 섞여 있어(toAvatarId) 문자열로
    // 비교하면 아무것도 안 바꿔도 저장 버튼이 켜졌다.
    const avatarChanged = Boolean(profile) && profileId !== toAvatarId(profile?.profileImageUrl, profile?.gender ?? "");
    const isDirty = Boolean(profile) && (
        avatarChanged ||
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
                    setNicknameErrors([NICKNAME_TAKEN_MESSAGE]);
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
            switch (getApiErrorCode(err)) {
                case API_ERROR_CODE.NICKNAME_ALREADY_EXISTS:
                    setNicknameErrors([NICKNAME_TAKEN_MESSAGE]);
                    break;
                case API_ERROR_CODE.NICKNAME_CHANGE_IN_ACTIVE_CHAT:
                    setNicknameErrors([NICKNAME_IN_CHAT_MESSAGE]);
                    break;
                case API_ERROR_CODE.NICKNAME_CHANGE_LOCKED:
                    // 다른 기기에서 먼저 소진한 경우다. 해제 시각을 다시 읽어 입력을 잠근다.
                    setNicknameErrors([`· ${toLockedMessage(nicknameQuota.lockedUntil)}`]);
                    getExternalCurrentUser()
                        .then((me) => setNicknameQuota({
                            remaining: me.nicknameChangeRemaining ?? 0,
                            lockedUntil: me.nicknameChangeLockedUntil,
                        }))
                        .catch(() => setNicknameQuota((prev) => ({ ...prev, remaining: 0 })));
                    break;
                default:
                    showToast("프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
            }
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
                    // 2회를 다 쓰면 잠긴다.
                    disabled={nicknameLocked}
                    status={nicknameErrors.length > 0 ? "error" : nicknameLocked ? "disabled" : "default"}
                    errmessage={nicknameErrors}
                    message={nicknameErrors.length > 0 ? undefined : toNicknameHelper(nicknameQuota)}
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
                                // 프로필이 오기 전에 고른 값은 늦게 도착한 응답이 덮어써 사라진다 — 오기 전엔 막는다.
                                disabled={!profile || (!interests.includes(option.value) && interests.length >= MAX_INTEREST_COUNT)}
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

/**
 * 저장된 프로필 사진 URL에서 아바타 ID(m1~m8, f1~f8)를 읽는다. 세 형태가 섞여 있다 —
 * 가입은 `/onboarding/profileimg/avatar/m1.svg`, 예전 프로필 수정은 `/assets/avatar/m1.png`,
 * 지금 프로필 수정은 `/assets/avatar/m1.webp`. 예전에는 `.png` 만 읽어 가입 그대로인 회원은
 * 수정 화면에서 자기 아바타 대신 기본값이 골라져 있었다.
 */
function toAvatarId(profileImageUrl: string | undefined, gender: string): string {
    const match = profileImageUrl?.match(/\/([mf]\d)\.(?:png|svg|webp)$/);
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
