import { useEffect } from 'react';
import { authService } from '@/modules/auth';
import { useAuthStore } from '@/stores/auth-store';

export function useAuthInit() {
  const setSession = useAuthStore((s) => s.setSession);
  useEffect(() => {
    authService.getSession().then((session) => setSession(session));
    const unsubscribe = authService.onAuthStateChange((session) => {
      setSession(session);
    });
    return unsubscribe;
  }, []);
}
