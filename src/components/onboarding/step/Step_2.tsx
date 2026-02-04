import {
  useToast
} from "@/context/ToastContext";
import {
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
} from "../../common/Text";
import {
  MultiSelectChip
} from "../../input/Multiselect";
import {
  Select
} from "../../input/Select";
import {
  TextField
} from "../../input/TextField";
import {
  DefaultContainer,
  DivideContainer,
  DividedInner,
  ProfileContainer,
  ProfileEdit,
  ProfileImg,
  ProfileWrapper,
} from "../OnboardingContainer";
import ProfileSelect from "../ProfileSelect";

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
  const [nickset, setNickset] = useState<boolean>(false);
  const [profileModal, setProfileModal] = useState<boolean>(false);

  const MAX_INTEREST = 5;

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
    
    setNickerr(newErrors);
    return newErrors.length === 0;
  };

  // 4. (UI용) 닉네임 저장 버튼 클릭 시
  const nicknameSave = async () => {
    if (nickset) {
      setNickset(false); // 수정 모드로 전환
      return;
    }

    if (validateNickname(data.nickname)) {
      // TODO: 백엔드 닉네임 중복 확인 API 구현 후 아래 주석 해제
      /*
      try {
        await request(OpenAPI, {
          method: "GET",
          url: `/api/users/nickname/${data.nickname}/availability`,
        });

        // 성공 (2xx) -> 사용 가능한 닉네임
        setNickset(true); // 저장 완료 상태로 전환
        showToast("닉네임이 저장되었어요.", "success");
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          // 409 Conflict -> 중복된 닉네임
          setNickerr(["이미 사용 중인 닉네임입니다."]);
        } else {
          // 그 외 API 오류
          console.error("Nickname check failed:", error);
          showToast("닉네임 확인 중 오류가 발생했습니다.", "error");
        }
      }
      */

      // 현재는 API가 없으므로 로컬 검증만 통과하면 저장 처리
      setNickset(true);
      showToast("닉네임이 저장되었어요.", "success");
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

      const isComplete = 
        !!data.gender &&
        !!data.age &&
        data.interest.length === 5 &&
        !!data.place &&
        !!data.job;
      
      if(data.interest.length !== 5) {
        showToast("관심사를 5개 선택해주세요.","error");
        return isComplete;
      }

      if(!isComplete) {
        showToast("빈칸을 채워주세요.","error");
      }

      return isComplete; // true면 부모가 다음 단계로 이동시킴
    }
  }));

  // 6. 버튼 활성화 상태 관리 (시각적 피드백용)
  useEffect(() => {
    // 닉네임이 set 상태가 아니더라도, 닉네임 텍스트가 유효하고 나머지 값이 다 있다면 활성화 가능
    // 여기서는 보수적으로 '모든 필드가 채워졌는지'만 확인하여 버튼 색상 변경
    const isFormFilled =
      data.nickname.length >= 2 &&
      !!data.gender &&
      !!data.age &&
      data.interest.length === 5 &&
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
        <ProfileImg imageUrl={"/onboarding/profileimg/avatar/" + profile + ".svg"} />
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
            /* ... 나머지 지역 옵션들 ... */
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
            { label: "학생", value: "student" },
            /* ... 나머지 직업 옵션들 ... */
            { label: "기타", value: "etc" },
          ]}
        />
      </DefaultContainer>
    </ProfileContainer>
  );
});

Step2Profile.displayName = "Step2Profile"; 