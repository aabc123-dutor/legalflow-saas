'use client';
import { useQuery } from '@tanstack/react-query';
import { expedientesApi } from '@/lib/api';
import Link from 'next/link';
import { FolderOpen, Plus } from 'lucide-react';

const ESTADO_COLOR: Record<string, string> = {
  ABIERTO: 'bg-green-100 text-green-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  PENDIENTE_CLIENTE: 'bg-amber-100 text-amber-700',
  ARCHIVADO: 'bg-gray-100 text-gray-500',
  CERRADO: 'bg-red-100 text-red-700',
};

export default function ExpedientesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['expedientes'], queryFn: () => expedientesApi.list().then((r) => r.data) });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expedientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tus asuntos y casos</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo expediente
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        <div className="divide-y">
          {data?.map((exp: any) => (
            <Link key={exp.id} href={`/dashboard/expedientes/${exp.id}`} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors block">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{exp.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{exp.descripcion ?? 'Sin descripción'}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>{exp.estado}</span>
              <span className="text-xs text-gray-400 shrink-0">{new Date(exp.fechaApertura).toLocaleDateString('es-ES')}</span>
            </Link>
          ))}
          {data?.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No hay expedientes. Crea el primero.</div>
          )}
        </div>
      </div>
    </div>
  );
}
