import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState } from "../../../common/DataModels/User";


// Reads the JS-accessible cookie set by setCredentials (named "app_token", NOT "access_token")
export function getTokenCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)app_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

type SetCredentialsPayload = {
  token: string | null;
  user: {
    id: number;
    email: string;
    name: string;
    role_id: number;
    phone_number: string;
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    isAuthenticated: false,
    userId: null,
    roleId: null,
  } as AuthState,
  reducers: {
    setCredentials(state, action: PayloadAction<SetCredentialsPayload>) {
      const { token, user } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      state.userId = user?.id ?? null;
      state.roleId = user?.role_id ?? null;
    },
    clearCredentials(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.userId = null;
      state.roleId = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;