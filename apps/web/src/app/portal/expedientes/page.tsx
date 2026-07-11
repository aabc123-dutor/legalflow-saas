'use client';

import { useQuery } from '@tanstack/react-query';
import { expedientesApi } from '@/lib/api';
import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

const ESTADO_COLOR: Record<string, string> = {
  ABIERTO: 'bg-green-50 text-green-700',
  CERRADO: 'bg-gray-100 text-gray-500',
  ARCHIVADO: 'bg-amber-50 text-amber-700',
};

export default function PortalExpedientesPage() {
  const { data: expedientes, isLoading } = useQuery({
    queryKey: ['mis-expedientes'],
    queryFn: () => expedientesApi.getMios().then((r) => r.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis expedientes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Estado actual de tus procedimientos</p>
      </div>

      {isLoading && <div className="text-center text-gray-400 text-sm p-8">Cargando...</div>}

      {!isLoading && expedientes?.length === 0 && (
        <div className="bg-white rounded-xl border p-8 flex flex-col items-center text-gray-400 gap-3">
          <FolderOpen className="w-10 h-10" />
          <p className="text-sm">No tienes expedientes asignados.</p>
        </div>
      )}

      <div className="space-y-3">
        {expedientes?.map((e: any) => (
          <Link
            key={e.id}
            href={`/portal/expedientes/${e.id}`}
            className="block bg-white rounded-xl border px-6 py-4 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{e.titulo}</p>
                {e.descripcion && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{e.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Abierto el {new Date(e.fechaApertura).toLocaleDateString('es-ES')}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[e.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                {e.estado}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}