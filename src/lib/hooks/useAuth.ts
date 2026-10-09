'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthUser, isAuthenticated } from '../api';

/** Redirects to /login when there is no session (same as the live app). Returns the cached user. */
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    setUser(getAuthUser());
  }, [router]);
  return user;
}
