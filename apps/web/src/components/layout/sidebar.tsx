'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  Receipt,
  Calculator,
  Bot,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

const NAV = [
  
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['ABOGADO', 'CLIENTE'] },
  { href: '/dashboard/expedientes', label: 'Expedientes', icon: FolderOpen, roles: ['ABOGADO'] },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, roles: ['ABOGADO'] },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText , roles: ['ABOGADO']},
  { href: '/dashboard/facturas', label: 'Facturación', icon: Receipt , roles: ['ABOGADO']},
  { href: '/dashboard/fiscal', label: 'Dashboard Fiscal', icon: Calculator, roles: ['ABOGADO'] },
  { href: '/dashboard/ai', label: 'Asistente Legal', icon: Bot, roles: ['ABOGADO'] },
].filter((item) => item.roles.includes(user?.role ?? ''));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // seguimos con el logout local aunque falle la llamada al backend
    }
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="w-64 h-screen bg-brand-900 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-white/10 shrink-0 flex flex-col items-center text-center gap-2">
        <img src="/icono.png" alt="" className="h-9 w-auto" />
        <div>
          <p className="text-white text-sm tracking-[2px] leading-tight">MERINO &amp; VASKOVSKA</p>
          <p className="text-white/50 text-[10px] tracking-[3px] mt-1">ABOGADOS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm transition-colors border-l-2 ${active
                  ? 'bg-white/10 text-white font-medium border-gold-500'
                  : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.nombre?.[0]?.toUpperCase() ?? ''}{user?.apellidos?.[0]?.toUpperCase() ?? ''}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.nombre} {user?.apellidos}</p>
            <p className="text-white/50 text-xs truncate">{user?.plan}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}