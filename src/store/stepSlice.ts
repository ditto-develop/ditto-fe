import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface StepState {
  value: boolean;
}

const initialState: StepState = {
  value: false,
};

export const stepSlice = createSlice({
  name: "step",
  initialState,
  reducers: {
    setSteper: (state, action: PayloadAction<boolean>) => {
      state.value = action.payload;
  }}
});

export const { setSteper } = stepSlice.actions;
export default stepSlice.reducer;
