import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState } from "../../../common/DataModels/User";

const initialState : AuthState = {
    token : null,
    isAuthenticated : false
}

const authSlice = createSlice (
    {
        name : 'auth',
        initialState,
        reducers : {
            setCredentials(state, action : PayloadAction<string>) {
                state.token = action.payload;
                state.isAuthenticated = true;
            },
            clearCredentials(state){
                state.token = null;
                state.isAuthenticated = false;
            }
        }
    }
)

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;