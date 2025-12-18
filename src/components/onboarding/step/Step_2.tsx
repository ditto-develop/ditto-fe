import { TextField } from "@/components/TextField";
import { MultiSelectChip } from "@/components/Multiselect";
import { Select } from "@/components/Select";
import { DivideContainer, DividedInner, DefaultContainer, ProfileContainer, ProfileImg, ProfileEdit, ProfileWrapper } from "@/styled/onboarding/Container";
import { Caption1, Label1Normal } from "@/styled/Text";
import { useEffect, useState } from "react";
import styled from "styled-components";
import ProfileSelect from "../ProfileSelect";
import { FormData,ControlButtonVariant, OnChange } from "@/types/type";

const interestOptions = [
  { label: "💪 운동", value: "workout" },
  { label: "🍿 영화/드라마", value: "movie-drama" },
  { label: "💃 공연", value: "performance" },
  { label: "📷 사진", value: "photography" },
  { label: "📚 독서", value: "reading" },
  { label: "🎵 음악", value: "music" },
  { label: "🧑‍🍳 요리", value: "cooking" },
  { label: "✈️ 여행", value: "travel" },
  { label: "🎮 게임", value: "gaming" },
  { label: "💰 재테크", value: "finance" },
  { label: "🚀 자기계발", value: "self-improvement" },
  { label: "🐶 반려동물", value: "pets" },
  { label: "💬 기타", value: "etc" },
];

interface Step2Props {
  data: FormData;     // ✅ FormData 통일
  onChange: OnChange; // ✅ 시그니처 통일
  setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
}

export function Step2Profile({ data, onChange, setControlButton }: Step2Props) {
  /** UI State만 유지 */
  const [profile, setProfile] = useState(data.pic);
  const [nickerr, setNickerr] = useState<string[]>([]);
  const [nickset, setNickset] = useState<boolean>(false);
  const [profileModal, setProfileModal] = useState<boolean>(false);

  const MAX_INTEREST = 5;

  // 이미지 토글
  const profileToggle = (value: string) => {
    setProfile(value);
    onChange("pic",value);
  };

  // ✅ 관심사 토글: data.interest 기준으로 업데이트
  const handleToggle = (value: string) => {
    const prev = data.interest;

    if (prev.includes(value)) {
      onChange("interest", prev.filter((v) => v !== value));
      return;
    }

    if (prev.length >= MAX_INTEREST) return;

    onChange("interest", [...prev, value]);
  };

  // ✅ 닉네임 저장(검증 후 lock)
  const nicknameSave = () => {
    if (nickset) {
      setNickset(false);
      return;
    }

    const newErrors: string[] = [];

    if (data.nickname.length < 2 || data.nickname.length > 10) {
      newErrors.push("· 닉네임은 2자 이상 10자 이하로 입력해주세요.");
    }

    const regex = /^[a-zA-Z0-9가-힣]+$/;
    if (!regex.test(data.nickname)) {
      newErrors.push("· 한글, 영문, 숫자만 사용할 수 있습니다. (특수문자, 공백 불가)");
    }

    setNickerr(newErrors);

    if (newErrors.length === 0) {
      setNickset(true);
      // 저장 API 호출 등...
    }
  };

  // ✅ 버튼 활성화 조건 (원하는 조건으로 조정 가능)
  useEffect(() => {
    console.log(data);

    const ok =
      nickset &&
      !!data.gender &&
      !!data.age &&
      data.interest.length == 5 &&
      !!data.place &&
      !!data.job;
    
    console.log(ok);

    setControlButton(ok ? "primary" : "disabled");
  }, [nickset, data.gender, data.age, data.interest, data.place, data.job, setControlButton]);

  if (profileModal) {
    return (
      <ProfileSelect
        profile={profile}
        setProfile={profileToggle}
        setProfileModal={setProfileModal}
      />
    );
  }

  return (
    <ProfileContainer>
      <ProfileWrapper>
        <ProfileImg imageUrl={"/onboarding/profileimg/avatar/"+profile+".svg" }/>
        <ProfileEdit onClick={() => setProfileModal(true)} />
      </ProfileWrapper>

      <DefaultContainer>
        {nickset ? (
          <TextField
            label="닉네임"
            isessential
            status="disabled"
            placeholder="사용할 닉네임을 입력해주세요"
            errmessage={nickerr}
            rightAddonText="수정"
            rightAddonVariant="button"
            value={data.nickname}
            onRightAddonClick={nicknameSave}
            onChange={(e) => onChange("nickname", e.target.value)}
            maxLength={10}
          />
        ) : nickerr.length > 0 ? (
          <TextField
            label="닉네임"
            isessential
            status="error"
            placeholder="사용할 닉네임을 입력해주세요"
            errmessage={nickerr}
            rightAddonText="저장"
            rightAddonVariant="button"
            value={data.nickname}
            onRightAddonClick={nicknameSave}
            onChange={(e) => onChange("nickname", e.target.value)}
            maxLength={10}
          />
        ) : (
          <TextField
            label="닉네임"
            isessential
            placeholder="사용할 닉네임을 입력해주세요"
            message={`${data.nickname.length}/10자`}
            rightAddonText="저장"
            rightAddonVariant="button"
            value={data.nickname}
            onRightAddonClick={nicknameSave}
            onChange={(e) => onChange("nickname", e.target.value)}
            maxLength={10}
          />
        )}
      </DefaultContainer>

      <DivideContainer>
        <DividedInner>
          <Select
            label="성별"
            isessential
            bottomSheetTitle="성별"
            value={data.gender}
            onChange={(v) => onChange("gender", v)}
            options={[
              { label: "남자", value: "man" },
              { label: "여자", value: "woman" },
            ]}
          />
        </DividedInner>

        <DividedInner>
          <Select
            label="나이"
            isessential
            bottomSheetTitle="나이"
            value={data.age}
            onChange={(v) => onChange("age", v)}
            options={[
              { label: "20 ~ 24", value: "20-24" },
              { label: "25 ~ 29", value: "25-29" },
              { label: "30 ~ 34", value: "30-34" },
              { label: "35 ~ 39", value: "35-39" },
              { label: "40 ~ 45", value: "40-45" },
              { label: "45 ~ 49", value: "45-49" },
              { label: "50 ~ 59", value: "50-59" },
              { label: "60 이상", value: "60+" },
            ]}
          />
        </DividedInner>
      </DivideContainer>

      <DefaultContainer>
        <div style={{ display: "flex", gap: "4px" }}>
          <Label1Normal $weight="bold">관심사</Label1Normal>
          <Caption1 $color="rgba(47, 43, 39, 0.61)">{data.interest.length}/5</Caption1>
          <Label1Normal $color="var(--color-status-destructive)">*</Label1Normal>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "320px" }}>
          {interestOptions.map((opt) => {
            const isSelected = data.interest.includes(opt.value);
            const isMaxReached = data.interest.length >= 5;

            return (
              <MultiSelectChip
                key={opt.value}
                option={opt}
                size="large"
                selectedValues={data.interest}
                sizeConfig={{ width: 74, height: 40 }}
                onClick={handleToggle}
                disabled={!isSelected && isMaxReached}
              />
            );
          })}
        </div>
      </DefaultContainer>

      <DefaultContainer>
        <Select
          label="사는 곳"
          isessential
          bottomSheetTitle="사는 곳"
          value={data.place}
          onChange={(v) => onChange("place", v)}
          options={[
            { label: "서울", value: "seoul" },
            { label: "경기", value: "gyeonggi" },
            { label: "인천", value: "incheon" },
            { label: "부산", value: "busan" },
            { label: "대구", value: "daegu" },
            { label: "대전", value: "daejeon" },
            { label: "광주", value: "gwangju" },
            { label: "울산", value: "ulsan" },
            { label: "세종", value: "sejong" },
            { label: "강원", value: "gangwon" },
            { label: "충북", value: "chungbuk" },
            { label: "충남", value: "chungnam" },
            { label: "전북", value: "jeonbuk" },
            { label: "전남", value: "jeonnam" },
            { label: "경북", value: "gyeongbuk" },
            { label: "경남", value: "gyeongnam" },
            { label: "제주", value: "jeju" },
          ]}
        />
      </DefaultContainer>

      <DefaultContainer>
        <Select
          label="직업"
          isessential
          bottomSheetTitle="직업"
          value={data.job}
          onChange={(v) => onChange("job", v)}
          options={[
            { label: "IT/기술", value: "it-tech" },
            { label: "경영/사무", value: "management-office" },
            { label: "마케팅/광고", value: "marketing-advertising" },
            { label: "디자인", value: "design" },
            { label: "교육", value: "education" },
            { label: "의료/보건", value: "medical-health" },
            { label: "금융", value: "finance" },
            { label: "법률", value: "law" },
            { label: "제조/생산", value: "manufacturing-production" },
            { label: "유통/판매", value: "distribution-sales" },
            { label: "서비스", value: "service" },
            { label: "건설", value: "construction" },
            { label: "예술/미디어", value: "art-media" },
            { label: "연구", value: "research" },
            { label: "공공/행정", value: "public-administration" },
            { label: "학생", value: "student" },
            { label: "기타", value: "etc" },
          ]}
        />
      </DefaultContainer>
    </ProfileContainer>
  );
}
