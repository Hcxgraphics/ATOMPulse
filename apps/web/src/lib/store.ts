import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  departmentId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void;
  clearAuth: () => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken = null) =>
        set({ user, token: accessToken, accessToken, refreshToken, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, token: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      login: (user, token) =>
        set({ user, token, accessToken: token, refreshToken: null, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'atompulse-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
