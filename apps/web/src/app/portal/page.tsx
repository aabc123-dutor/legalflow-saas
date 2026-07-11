'use client';

import { useQuery } from '@tanstack/react-query';
import { expedientesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function PortalInicioPage() {
  const { user } = useAuthStore();

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['resumen-portal'],
    queryFn: () => expedientesApi.getResumenPortal().then((r) => r.data),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de tus procedimientos</p>
      </div>

      {isLoading && <div className="text-gray-400 text-sm">Cargando...</div>}

      <div className="grid grid-cols-1 gap-6">

        {/* Próximos hitos */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-gray-700">Próximos eventos</h2>
          </div>
          {resumen?.hitos?.length === 0 && (
            <div className="p-6 text-sm text-gray-400">No hay eventos próximos.</div>
          )}
          {resumen?.hitos?.length > 0 && (
            <div className="divide-y">
              {resumen.hitos.map((h: any) => (
                <div key={h.id} className="px-6 py-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{h.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{h.expediente?.titulo}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 ml-4">
                    {new Date(h.fecha).toLocaleDateString('es-ES')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facturas próximas a vencer */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">Facturas pendientes de pago</h2>
          </div>
          {resumen?.facturas?.length === 0 && (
            <div className="p-6 text-sm text-gray-400">No hay facturas pendientes próximas.</div>
          )}
          {resumen?.facturas?.length > 0 && (
            <div className="divide-y">
              {resumen.facturas.map((f: any) => {
                const diasParaVencer = f.fechaVencimiento
                  ? Math.ceil((new Date(f.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const urgente = diasParaVencer !== null && diasParaVencer <= 3;

                return (
                  <div key={f.id} className={`px-6 py-4 flex items-start justify-between ${urgente ? 'bg-red-50' : ''}`}>
                    <div>
                      <p className={`text-sm font-medium ${urgente ? 'text-red-700' : 'text-gray-900'}`}>
                        {f.numero}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.expediente?.titulo}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className={`text-sm font-medium ${urgente ? 'text-red-700' : 'text-gray-900'}`}>
                        {Number(f.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </p>
                      <p className="text-xs text-gray-400">
                        Vence {f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString('es-ES') : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}