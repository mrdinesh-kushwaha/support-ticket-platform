import { create } from 'zustand';
import type { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const stored = localStorage.getItem('user');
const storedUser: User | null = stored ? JSON.parse(stored) : null;
const storedToken = localStorage.getItem('token');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken,

  login: (data: AuthResponse) => {
    const user: User = {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: data.token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
