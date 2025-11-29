import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserToken {
  id: number;
  username: string;
  role: 'admin' | 'vendor' | 'purchasing';
  name: string;
  iat?: number;
  exp?: number;
}

export function useAuth() {
  const [user, setUser] = useState<UserToken | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Decodificar el token JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const decoded = JSON.parse(atob(parts[1]));
      setUser(decoded);
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const hasRole = (allowedRoles: string[]) => {
    return user && allowedRoles.includes(user.role);
  };

  return { user, loading, hasRole };
}
