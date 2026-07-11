import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { FileText, FolderOpen, Receipt, Home } from 'lucide-react';
import { PortalNav } from '@/components/portal/PortalNav';

const NAV = [
  { href: '/portal', label: 'Inicio', icon: Home },
  { href: '/portal/expedientes', label: 'Mis expedientes', icon: FolderOpen },
  { href: '/portal/documentos', label: 'Mis documentos', icon: FileText },
  { href: '/portal/facturas', label: 'Mis facturas', icon: Receipt },
];

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
          <PortalNav />
        </aside>
        <main className="ml-64 flex-1 min-h-screen bg-gray-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}