'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  console.log('AuthGuard:', { user, accessToken, checking });
  useEffect(() => {
    if (accessToken) {
      setChecking(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        setAuth(res.data, useAuthStore.getState().accessToken ?? '');
        setChecking(false);
      })
      .catch(async () => {
        try {
          // Intenta renovar con la cookie de refresh
          const { data } = await authApi.refresh();
          setAuth(user!, data.accessToken);
          setChecking(false);
        } catch {
          clearAuth();
          router.replace('/login');
        }
      });
  }, [accessToken, setAuth, clearAuth, router]);


  console.log('AuthGuard state:', { checking, user, accessToken });

  if (checking) return null;
  if (!user) return null;

  return <>{children}</>;
}