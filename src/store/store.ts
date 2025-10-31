import { configureStore } from "@reduxjs/toolkit";
import referalReducer from "./referalSlice";
import stepReducer from "./stepSlice";
import sitemapReducer from "./sitemapSlice";
import sameCountReducer from "./sameCountSlice";


export const store = configureStore({
  reducer: {
    referal: referalReducer,
    step: stepReducer,
    where: sitemapReducer,
    samecount: sameCountReducer
  },
});

// ✅ RootState & AppDispatch 타입 추출
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
