import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  mode: 'form' | 'chat';
  toasts: Toast[];
}

const initialState: UIState = {
  mode: 'chat',
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<'form' | 'chat'>) => {
      state.mode = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const newToast = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(),
      };
      state.toasts.push(newToast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    }
  },
});

export const { setMode, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
