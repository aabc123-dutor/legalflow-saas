import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nombre: string;
  role: string;
  plan: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('accessToken', accessToken);
        }
        set({ user, accessToken });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('accessToken');
        }
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'legalflow-auth',
      // Solo persistimos el usuario (datos no sensibles). El accessToken vive
      // solo en memoria: se pierde al cerrar la pestaña y el interceptor de
      // axios lo renueva automáticamente via refresh token (HttpOnly cookie).
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
