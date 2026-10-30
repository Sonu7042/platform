import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import websitesReducer from '../features/websites/websitesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    websites: websitesReducer,
  },
});
