import { AuthGuard } from '@/components/auth/AuthGuard';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex">
        <aside className="w-64 h-screen bg-brand-900 flex flex-col fixed left-0 top-0">
          <div className="p-6 border-b border-white/10 flex flex-col items-center text-center gap-2">
            <img src="/icono.png" alt="" className="h-9 w-auto" />
            <div>
              <p className="text-white text-sm tracking-[2px] leading-tight">MERINO &amp; VASKOVSKA</p>
              <p className="text-white/50 text-[10px] tracking-[3px] mt-1">PORTAL DEL CLIENTE</p>
            </div>
          </div>
        </aside>
        <main className="ml-64 flex-1 min-h-screen bg-gray-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}