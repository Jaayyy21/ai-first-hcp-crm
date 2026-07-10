import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Interaction {
  id: number;
  hcp_id: number;
  interaction_date: string;
  interaction_type: string;
  channel: string;
  summary: string;
  topics_discussed: string;
  requested_action: string;
  follow_up_date: string | null;
  status: string;
}

interface InteractionState {
  history: Interaction[];
  editingInteraction: Interaction | null;
  loading: boolean;
  error: string | null;
}

const initialState: InteractionState = {
  history: [],
  editingInteraction: null,
  loading: false,
  error: null,
};

export const fetchHistory = createAsyncThunk(
  'interaction/fetchHistory',
  async (hcpId: number) => {
    const response = await fetch(`http://localhost:8000/api/hcps/${hcpId}/interactions`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  }
);

export const saveInteraction = createAsyncThunk(
  'interaction/save',
  async (interaction: Partial<Interaction>) => {
    const url = interaction.id 
      ? `http://localhost:8000/api/interactions/${interaction.id}`
      : `http://localhost:8000/api/interactions`;
      
    const method = interaction.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction),
    });
    
    if (!response.ok) throw new Error('Failed to save interaction');
    return await response.json();
  }
);

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    setEditingInteraction: (state, action: PayloadAction<Interaction | null>) => {
      state.editingInteraction = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching history';
      })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        // If editing, replace. If new, unshift
        const index = state.history.findIndex(i => i.id === action.payload.id);
        if (index >= 0) {
          state.history[index] = action.payload;
        } else {
          state.history.unshift(action.payload);
        }
        state.editingInteraction = null;
      });
  },
});

export const { setEditingInteraction } = interactionSlice.actions;
export default interactionSlice.reducer;
