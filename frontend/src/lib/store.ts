import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/lib/baseApi";

import authReducer from "@/features/auth/authSlice";


import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistStore,
  persistReducer,
} from "redux-persist";

import createWebStorage from "redux-persist/lib/storage/createWebStorage";

/* -----------------------------
   Safe storage (Next.js SSR fix)
------------------------------*/
const createNoopStorage = () => ({
  getItem(_key: string) {
    return Promise.resolve(null);
  },
  setItem(_key: string, value: any) {
    return Promise.resolve(value);
  },
  removeItem(_key: string) {
    return Promise.resolve();
  },
});

const storage = typeof window === "undefined" ? createNoopStorage() : createWebStorage("local");

/* -----------------------------
   Persist Config (auth only)
------------------------------*/
const persistConfig = {
  key: "auth",
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

/* -----------------------------
   Store
------------------------------*/
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
  
    // RTK Query (ONLY ONE API)
    [baseApi.reducerPath]: baseApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

/* -----------------------------
   Types
------------------------------*/
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/* -----------------------------
   Persistor
------------------------------*/
export const persistor = persistStore(store);
