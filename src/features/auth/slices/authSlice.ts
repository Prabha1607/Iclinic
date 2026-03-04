import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState } from "../../../common/DataModels/User";

// ── JWT helpers ────────────────────────────────────────────────────────────────
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ── Cookie helpers ─────────────────────────────────────────────────────────────
export function setTokenCookie(token: string) {
  // 7-day expiry; adjust as needed
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `access_token=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getTokenCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearTokenCookie() {
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// ── Bootstrap from cookie on page load ────────────────────────────────────────
function buildInitialState(): AuthState {
  const token = getTokenCookie();
  if (token) {
    const payload = parseJwt(token);
    if (payload && payload.sub) {
      return {
        token,
        isAuthenticated: true,
        userId: typeof payload.user_id === "number" ? payload.user_id : null,
        roleId: typeof payload.role_id === "number" ? payload.role_id : null,
      };
    }
  }
  return { token: null, isAuthenticated: false, userId: null, roleId: null };
}

const authSlice = createSlice({
  name: "auth",
  initialState: buildInitialState(),
  reducers: {
    setCredentials(state, action: PayloadAction<string>) {
      const token = action.payload;
      const payload = parseJwt(token);
      state.token = token;
      state.isAuthenticated = true;
      state.userId = typeof payload?.user_id === "number" ? payload.user_id : null;
      state.roleId = typeof payload?.role_id === "number" ? payload.role_id : null;
      setTokenCookie(token);
    },
    clearCredentials(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.userId = null;
      state.roleId = null;
      clearTokenCookie();
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
