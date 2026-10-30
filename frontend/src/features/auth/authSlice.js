import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { registerRequest, loginRequest, meRequest } from '../../services/authService';

const initialState = {
  user: null,
  token: localStorage.getItem('builder_token') || null,
  status: 'idle',
  error: null,
  bootstrapped: false,
};

export const registerThunk = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return await registerRequest(payload);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginThunk = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    return await loginRequest(payload);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const bootstrapAuthThunk = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    return await meRequest();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('builder_token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('builder_token', action.payload.token);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('builder_token', action.payload.token);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(bootstrapAuthThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapAuthThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(bootstrapAuthThunk.rejected, (state) => {
        state.status = 'failed';
        state.user = null;
        state.token = null;
        state.bootstrapped = true;
        localStorage.removeItem('builder_token');
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
