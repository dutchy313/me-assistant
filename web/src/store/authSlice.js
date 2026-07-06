import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getMe,
  loginUser,
  registerUser,
  verifyLoginOtp
} from "../api/authApi";

const savedToken = localStorage.getItem("me_assistant_token");

const initialState = {
  user: null,
  token: savedToken,
  tempToken: null,
  requiresOtp: false,
  status: "idle",
  error: null
};

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      return await registerUser(formData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      return await loginUser(formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async (formData, { rejectWithValue }) => {
    try {
      return await verifyLoginOtp(formData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      return await getMe();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not fetch user"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.tempToken = null;
      state.requiresOtp = false;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("me_assistant_token");
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        localStorage.setItem("me_assistant_token", action.payload.data.token);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";

        if (action.payload.data.requiresOtp) {
          state.requiresOtp = true;
          state.tempToken = action.payload.data.tempToken;
          return;
        }

        state.requiresOtp = false;
        state.tempToken = null;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        localStorage.setItem("me_assistant_token", action.payload.data.token);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(verifyOtpThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.requiresOtp = false;
        state.tempToken = null;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        localStorage.setItem("me_assistant_token", action.payload.data.token);
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchMeThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.data.user;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        state.status = "idle";
        state.user = null;
        state.token = null;
        localStorage.removeItem("me_assistant_token");
      });
  }
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;