import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchWebsites,
  fetchWebsiteStats,
  createWebsiteRequest,
  updateWebsiteRequest,
  deleteWebsiteRequest,
} from '../../services/websiteService';

const initialState = {
  items: [],
  pagination: { page: 1, pageSize: 12, total: 0, totalPages: 1 },
  stats: null,
  status: 'idle',
  statsStatus: 'idle',
  error: null,
};

export const loadWebsitesThunk = createAsyncThunk(
  'websites/list',
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchWebsites(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load websites');
    }
  },
);

export const loadDashboardStatsThunk = createAsyncThunk(
  'websites/stats',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchWebsiteStats();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load stats');
    }
  },
);

export const createWebsiteThunk = createAsyncThunk(
  'websites/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await createWebsiteRequest(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create website');
    }
  },
);

export const updateWebsiteThunk = createAsyncThunk(
  'websites/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateWebsiteRequest(id, payload);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update website');
    }
  },
);

export const deleteWebsiteThunk = createAsyncThunk(
  'websites/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteWebsiteRequest(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete website');
    }
  },
);

const websitesSlice = createSlice({
  name: 'websites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWebsitesThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadWebsitesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(loadWebsitesThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loadDashboardStatsThunk.pending, (state) => {
        state.statsStatus = 'loading';
      })
      .addCase(loadDashboardStatsThunk.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(loadDashboardStatsThunk.rejected, (state, action) => {
        state.statsStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(createWebsiteThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateWebsiteThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(deleteWebsiteThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((w) => w.id !== action.payload);
      });
  },
});

export default websitesSlice.reducer;
