import { createAsyncThunk, createSlice, isRejectedWithValue } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import type { User } from '../../api/types';
import { toRejectValue, type RejectValue } from '../../app/rejectValue';

export interface AuthState {
  user: User | null;
  /** true, sobald beim App-Start geprüft wurde, ob noch ein gültiges Cookie existiert. */
  initialized: boolean;
  loading: boolean;
  error: RejectValue | null;
}

const initialState: AuthState = {
  user: null,
  initialized: false,
  loading: false,
  error: null,
};

/** Beim Start: Fragt das Backend, ob das Cookie noch gültig ist und wer angemeldet ist. */
export const fetchCurrentUser = createAsyncThunk<User | null, void, { rejectValue: RejectValue }>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (error) {
      const value = toRejectValue(error);
      return value.status === 401 ? null : rejectWithValue(value);
    }
  },
);

export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: RejectValue }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    return await authApi.login(email, password);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: RejectValue }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (error) {
      return rejectWithValue(toRejectValue(error));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.initialized = true;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
      })
      // Antwortet das Backend irgendwo mit 401, ist das Token abgelaufen: lokal abmelden.
      .addMatcher(
        (action) =>
          isRejectedWithValue(action) &&
          action.type !== login.rejected.type &&
          (action.payload as RejectValue).status === 401,
        (state) => {
          state.user = null;
        },
      );
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
