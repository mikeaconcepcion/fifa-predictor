import BottomNav from '@/components/BottomNav';
import { SpoilerModeProvider } from '@/lib/spoiler-mode';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import AnnouncementBanner from '@/components/AnnouncementBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpoilerModeProvider>
      <ServiceWorkerRegistrar />
      <AnnouncementBanner />
      <div className="min-h-screen">
        <main className="pb-24">{children}</main>
        <BottomNav />
      </div>
    </SpoilerModeProvider>
  );
}
