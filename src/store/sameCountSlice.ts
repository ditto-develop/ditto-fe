import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SameCountState {
  count: number;
}

const initialState: SameCountState = {
  count: 8,
};

export const sameCountSlice = createSlice({
  name: "samecount",
  initialState,
  reducers: {
    setSamecount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
  }}
});

export const { setSamecount } = sameCountSlice.actions;
export default sameCountSlice.reducer;
