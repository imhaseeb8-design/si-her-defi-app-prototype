import { AppShell } from '@/components/app/AppShell';
import { SessionProvider } from '@/components/app/SessionProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
