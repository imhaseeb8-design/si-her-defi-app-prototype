'use client';
// Signed-in session data shared by the sidebar and pages: user, profile, wallet, certificate unlock.
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, certificateApi, isAuthenticated, walletApi } from '@/lib/api';
import type { Profile, User } from '@/lib/types';

interface Session {
  user: User | null;
  profile: Profile | null;
  wallet: string | null;
  certificateUnlocked: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Session>({ user: null, profile: null, wallet: null, certificateUnlocked: false, ready: false, refresh: async () => {} });
export const useSession = () => useContext(Ctx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [s, setS] = useState<Omit<Session, 'refresh'>>({ user: null, profile: null, wallet: null, certificateUnlocked: false, ready: false });

  const refresh = useCallback(async () => {
    const [me, wallet, cert] = await Promise.all([
      authApi.getMe(),
      walletApi.getStatus().catch(() => null),
      certificateApi.getCertificate().catch(() => null),
    ]);
    setS({
      user: me.user,
      profile: me.profile,
      wallet: wallet?.connected ? wallet.address : null,
      certificateUnlocked: !!cert && cert.status !== 'locked',
      ready: true,
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    refresh().catch(() => {});
  }, [refresh, router]);

  return <Ctx.Provider value={{ ...s, refresh }}>{children}</Ctx.Provider>;
}
