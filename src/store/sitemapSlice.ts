import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SitemapState {
  where: string;   // 현재 위치파악
}

const initialState: SitemapState = {
  where: '',
};

export const sitemapSlice = createSlice({
  name: "referal",
  initialState,
  reducers: {
    setWhere: (state, action: PayloadAction<string>) => {
      state.where = action.payload;
    },
  },
});

export const { setWhere } = sitemapSlice.actions;
export default sitemapSlice.reducer;
