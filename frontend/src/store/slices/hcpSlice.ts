import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface HCP {
  id: number;
  name: string;
  specialty: string;
  organization: string;
}

interface HCPState {
  searchResults: HCP[];
  selectedHcp: HCP | null;
  loading: boolean;
  error: string | null;
}

const initialState: HCPState = {
  searchResults: [],
  selectedHcp: null,
  loading: false,
  error: null,
};

export const searchHCPs = createAsyncThunk(
  'hcp/search',
  async (query: string) => {
    const response = await fetch(`http://localhost:8000/api/hcps?skip=0&limit=100`);
    if (!response.ok) throw new Error('Failed to fetch HCPs');
    const data = await response.json();
    return data.filter((hcp: HCP) => 
      hcp.name.toLowerCase().includes(query.toLowerCase()) || 
      hcp.specialty.toLowerCase().includes(query.toLowerCase())
    );
  }
);

const hcpSlice = createSlice({
  name: 'hcp',
  initialState,
  reducers: {
    selectHcp: (state, action: PayloadAction<HCP>) => {
      state.selectedHcp = action.payload;
    },
    clearSelection: (state) => {
      state.selectedHcp = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchHCPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchHCPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching HCPs';
      });
  },
});

export const { selectHcp, clearSelection } = hcpSlice.actions;
export default hcpSlice.reducer;
