import BottomNav from '@/components/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14]">
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
