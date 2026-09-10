import {
  useToast
} from "@/context/ToastContext";
import type {
  ControlButtonVariant,
  FormData,
  OnChange
} from "@/types/type";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from "react";
import {
  Caption1,
  Label1Normal
} from "@/shared/ui";
import {
  MultiSelectChip
} from "@/shared/ui";
import {
  Select
} from "@/shared/ui";
import {
  TextField
} from "@/shared/ui";
import { checkExternalNicknameAvailability } from "@/shared/lib/api/externalApi";
import { MIN_SIGNUP_AGE, isEligibleAge } from "@/shared/lib/age";
import { containsForbiddenNicknameWord } from "@/shared/lib/nicknameSafety";
import {
  DefaultContainer,
  DivideContainer,
  DividedInner,
  ProfileContainer,
  ProfileEdit,
  ProfileImg,
  ProfileWrapper,
} from "@/components/onboarding/OnboardingContainer";
import { ProfileSelect } from "@/components/onboarding/ProfileSelect";

export const interestOptions = [
  { label: "💪 운동", value: "workout" },
  { label: "🍿 영화/드라마", value: "movie-drama" },
  { label: "🖼️ 전시", value: "exhibition" },
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
  data: FormData;
  onChange: OnChange;
  setControlButton: React.Dispatch<React.SetStateAction<ControlButtonVariant>>;
}

export interface Step2Ref {
  handleSubmit: () => boolean;
}

export const Step2Profile = forwardRef<Step2Ref, Step2Props>(({ data, onChange, setControlButton }, ref) => {
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState(data.pic);
  const [nickerr, setNickerr] = useState<string[]>([]);
  const [emailerr, setEmailerr] = useState<string[]>([]);
  const [nickset, setNickset] = useState<boolean>(false);
  const [profileModal, setProfileModal] = useState<boolean>(false);

  const MAX_INTEREST = 5;
  const MIN_INTEREST = 1;

  // 1. 이미지 변경 핸들러
  const profileToggle = (value: string) => {
    setProfile(value);
    onChange("pic", value);
  };

  // 2. 관심사 토글 핸들러
  const handleToggle = (value: string) => {
    const prev = data.interest;
    if (prev.includes(value)) {
      onChange("interest", prev.filter((v) => v !== value));
      return;
    }
    if (prev.length >= MAX_INTEREST) return;
    onChange("interest", [...prev, value]);
  };

  // 3. 닉네임 검증 로직 (재사용을 위해 분리)
  const validateNickname = (nickname: string): boolean => {
    const newErrors: string[] = [];
    if (nickname.length < 2 || nickname.length > 10) {
      newErrors.push("· 닉네임은 2자 이상 10자 이하로 입력해주세요.");
    }
    const regex = /^[a-zA-Z0-9가-힣]+$/;
    if (!regex.test(nickname)) {
      newErrors.push("· 한글, 영문, 숫자만 사용할 수 있습니다. (특수문자, 공백 불가)");
    }
    if (containsForbiddenNicknameWord(nickname)) {
      newErrors.push("· 사용할 수 없는 닉네임입니다.");
    }

    setNickerr(newErrors);
    return newErrors.length === 0;
  };

  /**
   * 이메일 검증.
   *
   * 카카오에서 더 이상 이메일을 받지 않으므로(동의항목 축소, 2026-09-06) 여기가 유일한
   * 수집 경로다. 개인정보처리방침이 이메일을 **필수 수집 항목**으로 고지하고 있어
   * 선택 입력으로 두지 않는다.
   *
   * 형식 검사는 일부러 느슨하게 둔다 — RFC 를 흉내 낸 정규식은 정상 주소를 거절하는
   * 쪽으로 틀리기 쉽고, 실제 도달 여부는 어차피 여기서 판정할 수 없다.
   */
  const validateEmail = (email: string): boolean => {
    const trimmed = email.trim();
    const newErrors: string[] = [];

    if (trimmed.length === 0) {
      newErrors.push("· 이메일을 입력해주세요.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      newErrors.push("· 이메일 형식이 올바르지 않아요. (예: ditto@example.com)");
    }

    setEmailerr(newErrors);
    return newErrors.length === 0;
  };

  // 4. (UI용) 닉네임 저장 버튼 클릭 시
  const nicknameSave = async () => {
    if (nickset) {
      setNickset(false); // 수정 모드로 전환
      return;
    }

    if (validateNickname(data.nickname)) {
      try {
        const availability = await checkExternalNicknameAvailability(data.nickname);
        if (availability.available === false) {
          setNickerr(["이미 사용 중인 닉네임입니다."]);
          return;
        }
        setNickset(true); // 저장 완료 상태로 전환
        showToast("닉네임이 저장되었어요.", "success");
      } catch (error) {
        console.error("Nickname check failed:", error);
        showToast("닉네임 확인 중 오류가 발생했습니다.", "error");
      }
    }
  };

  // 5. ✅ 부모 컴포넌트(OnboardingLayout)의 '다음' 버튼 클릭 시 호출될 함수
  useImperativeHandle(ref, () => ({
    handleSubmit: () => {
      if (!nickset) {
        showToast("닉네임을 저장해주세요.","error");
        return false;
      }else {
        const isNickValid = validateNickname(data.nickname);
        if (!isNickValid) return false; // 닉네임 에러 시 진행 불가
        setNickset(true); 
      }

      // 이메일은 형식까지 봐야 하므로 빈칸 검사보다 먼저 돌린다.
      if (!validateEmail(data.email)) return false;

      const isComplete =
        !!data.gender &&
        !!data.birthDate &&
        data.interest.length >= MIN_INTEREST &&
        !!data.place &&
        !!data.job;

      // 관심사는 최소 1개(최대 5개). 하나도 고르지 않았을 때만 따로 알린다.
      if (data.interest.length < MIN_INTEREST) {
        showToast(`관심사를 ${MIN_INTEREST}개 이상 선택해주세요.`, "error");
        return false;
      }

      if(!isComplete) {
        showToast("빈칸을 채워주세요.","error");
        return false;
      }

      // 연령 게이트. 이용약관이 만 19세 미만의 가입을 거절하므로 여기서 막는다.
      if (!isEligibleAge(data.birthDate)) {
        showToast(`디토는 만 ${MIN_SIGNUP_AGE}세 이상만 가입할 수 있어요.`, "error");
        return false;
      }

      return true; // 부모가 다음 단계로 이동시킴
    }
  }));

  // 6. 버튼 활성화 상태 관리 (시각적 피드백용)
  useEffect(() => {
    // 닉네임이 set 상태가 아니더라도, 닉네임 텍스트가 유효하고 나머지 값이 다 있다면 활성화 가능
    // 여기서는 보수적으로 '모든 필드가 채워졌는지'만 확인하여 버튼 색상 변경
    const isFormFilled =
      data.nickname.length >= 2 &&
      data.email.trim().length > 0 &&
      !!data.gender &&
      !!data.birthDate &&
      data.interest.length >= MIN_INTEREST &&
      !!data.place &&
      !!data.job;

    setControlButton(isFormFilled ? "primary" : "disabled");
  }, [data, nickset, setControlButton]);

  // 프로필 모달 렌더링
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
        <ProfileImg imageUrl={"/assets/avatar/" + profile + ".png"} />
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

      <DefaultContainer>
        {/*
          카카오 동의항목에서 이메일을 뺐다(2026-09-06). 프리필로 채워질 수도 있지만
          비어 있는 경우가 기본이라 필수 입력으로 둔다 — 개인정보처리방침의 필수
          수집 항목이다.
        */}
        <TextField
          label="이메일"
          isessential
          type="email"
          inputMode="email"
          autoComplete="email"
          status={emailerr.length > 0 ? "error" : "default"}
          placeholder="이메일을 입력해주세요"
          errmessage={emailerr}
          value={data.email}
          onChange={(e) => {
            onChange("email", e.target.value);
            // 에러가 떠 있는 동안에만 재검증한다. 입력 첫 글자부터 빨개지지 않게.
            if (emailerr.length > 0) validateEmail(e.target.value);
          }}
        />
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
          {/*
            나이 구간 선택을 생년월일 입력으로 바꿨다. 본인인증을 붙이지 않기로 해
            (2026-08-30) 나이의 출처가 여기뿐이고, 구간 선택으로는 만 19세 경계를
            판정할 수 없었다. BE 에 보낼 연령대는 Tutorial 이 이 값에서 계산한다.

            input[type=date] 는 일부 인앱 웹뷰에서 탭해도 피커가 뜨지 않아 선택
            자체가 막혔다 — 연/월/일 네이티브 select 바텀시트(Select fieldType="date")로
            바꿔 플랫폼 피커가 항상 뜨도록 한다.
          */}
          <Select
            label="생년월일"
            isessential
            fieldType="date"
            bottomSheetTitle="생년월일"
            value={data.birthDate ?? ""}
            onChange={(v) => onChange("birthDate", v ?? "")}
          />
        </DividedInner>
      </DivideContainer>

      <DefaultContainer>
        <div style={{ display: "flex", gap: "4px" }}>
          <Label1Normal $weight="bold">관심사</Label1Normal>
          <Caption1 $color="rgba(47, 43, 39, 0.61)">{data.interest.length}/5</Caption1>
          <Label1Normal $color="var(--color-semantic-status-destructive)">*</Label1Normal>
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
            { label: "경영/사무", value: "management" },
            { label: "마케팅/광고", value: "marketing" },
            { label: "디자인", value: "design" },
            { label: "교육", value: "education" },
            { label: "의료/보건", value: "medical" },
            { label: "금융", value: "finance" },
            { label: "법률", value: "legal" },
            { label: "제조/생산", value: "manufacturing" },
            { label: "유통/판매", value: "distribution" },
            { label: "서비스", value: "service" },
            { label: "건설", value: "construction" },
            { label: "예술/미디어", value: "arts-media" },
            { label: "연구", value: "research" },
            { label: "공공/행정", value: "public-admin" },
            { label: "학생", value: "student" },
            { label: "기타", value: "etc" },
          ]}
        />
      </DefaultContainer>
    </ProfileContainer>
  );
});

Step2Profile.displayName = "Step2Profile"; 
