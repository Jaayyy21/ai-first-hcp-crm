import { configureStore } from '@reduxjs/toolkit';
import hcpReducer from './slices/hcpSlice';
import interactionReducer from './slices/interactionSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    hcp: hcpReducer,
    interaction: interactionReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
