import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Page, User } from '../../api/types';
import { usersApi } from '../../api/usersApi';
import { toRejectValue, type RejectValue } from '../../app/rejectValue';

export const PAGE_SIZE = 10;

export interface UsersState {
  page: Page<User> | null;
  search: string;
  loading: boolean;
  error: string | null;
  /** IDs der User, für die gerade eine Aktion läuft (Buttons werden deaktiviert). */
  busyIds: number[];
}

const initialState: UsersState = {
  page: null,
  search: '',
  loading: false,
  error: null,
  busyIds: [],
};

export const fetchUsers = createAsyncThunk<
  Page<User>,
  { search: string; page: number },
  { rejectValue: RejectValue }
>('users/fetchUsers', async ({ search, page }, { rejectWithValue }) => {
  try {
    return await usersApi.list(search, page, PAGE_SIZE);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

export const setUserEnabled = createAsyncThunk<
  User,
  { id: number; enabled: boolean },
  { rejectValue: RejectValue }
>('users/setUserEnabled', async ({ id, enabled }, { rejectWithValue }) => {
  try {
    return await usersApi.setEnabled(id, enabled);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

export const deleteUser = createAsyncThunk<number, number, { rejectValue: RejectValue }>(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await usersApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(toRejectValue(error));
    }
  },
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.search = action.meta.arg.search;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Users could not be loaded.';
      })
      .addCase(setUserEnabled.pending, (state, action) => {
        state.busyIds.push(action.meta.arg.id);
      })
      .addCase(setUserEnabled.fulfilled, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.payload.id);
        if (state.page) {
          state.page.content = state.page.content.map((user) =>
            user.id === action.payload.id ? action.payload : user,
          );
        }
      })
      .addCase(setUserEnabled.rejected, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.meta.arg.id);
        state.error = action.payload?.message ?? 'The user could not be updated.';
      })
      .addCase(deleteUser.pending, (state, action) => {
        state.busyIds.push(action.meta.arg);
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.meta.arg);
        state.error = action.payload?.message ?? 'The user could not be deleted.';
      });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
