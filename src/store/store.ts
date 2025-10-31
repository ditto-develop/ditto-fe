import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import referalReducer from "./referalSlice";
import stepReducer from "./stepSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    referal: referalReducer,
    step: stepReducer
  },
});

// ✅ RootState & AppDispatch 타입 추출
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
