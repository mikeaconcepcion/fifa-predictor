import BottomNav from '@/components/BottomNav';
import { SpoilerModeProvider } from '@/lib/spoiler-mode';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpoilerModeProvider>
      <ServiceWorkerRegistrar />
      <div className="min-h-screen bg-[#080c14]">
        <main className="pb-24">{children}</main>
        <BottomNav />
      </div>
    </SpoilerModeProvider>
  );
}
