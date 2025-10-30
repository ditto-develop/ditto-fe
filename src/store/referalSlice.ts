import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ReferralState {
  value: string;   // 기존 추천코드
  utm: string; // UTM 값 추가 (없을 수도 있으니 null)
  isRevisit: boolean;
}

const initialState: ReferralState = {
  value: '',
  utm: '',
  isRevisit: false,
};

export const referalSlice = createSlice({
  name: "referal",
  initialState,
  reducers: {
    setReferal: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
    setUtm: (state, action: PayloadAction<string>) => {
      state.utm = action.payload;
    },
    setisRevisit: (state, action: PayloadAction<boolean>) => {
      state.isRevisit = action.payload;
    }
  },
});

export const { setReferal, setUtm, setisRevisit } = referalSlice.actions;
export default referalSlice.reducer;
