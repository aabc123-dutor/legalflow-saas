'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, FolderOpen, Receipt, Home, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';

const NAV = [
    { href: '/portal', label: 'Inicio', icon: Home },
    { href: '/portal/expedientes', label: 'Mis expedientes', icon: FolderOpen },
    { href: '/portal/documentos', label: 'Mis documentos', icon: FileText },
    { href: '/portal/facturas', label: 'Mis facturas', icon: Receipt },
];

export function PortalNav() {
    const pathname = usePathname();
    const { user, clearAuth } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch { }
        clearAuth();
        router.push('/login');
    };

    return (
        <>
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = href === '/portal' ? pathname === '/portal' : pathname.startsWith(href);
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
                        <p className="text-white/50 text-xs truncate">Portal cliente</p>
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
        </>
    );
}