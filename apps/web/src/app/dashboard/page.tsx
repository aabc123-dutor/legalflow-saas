'use client';

import { useQuery } from '@tanstack/react-query';
import { expedientesApi, facturasApi, clientesApi } from '@/lib/api';
import { FolderOpen, Users, Receipt, TrendingUp } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: expedientes } = useQuery({ queryKey: ['expedientes'], queryFn: () => expedientesApi.list().then((r) => r.data) });
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => clientesApi.list().then((r) => r.data) });
  const { data: facturas } = useQuery({ queryKey: ['facturas'], queryFn: () => facturasApi.list().then((r) => r.data) });

  const totalFacturado = facturas?.filter((f: any) => f.estado === 'PAGADA').reduce((s: number, f: any) => s + Number(f.total), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Resumen</h1>
      <p className="text-gray-500 text-sm mb-8">Vista general de tu despacho</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Expedientes activos" value={expedientes?.filter((e: any) => e.estado !== 'CERRADO' && e.estado !== 'ARCHIVADO').length ?? '—'} icon={FolderOpen} color="bg-blue-500" />
        <StatCard title="Clientes" value={clientes?.length ?? '—'} icon={Users} color="bg-indigo-500" />
        <StatCard title="Facturas pendientes" value={facturas?.filter((f: any) => f.estado === 'EMITIDA').length ?? '—'} icon={Receipt} color="bg-amber-500" />
        <StatCard title="Total cobrado" value={`${totalFacturado.toFixed(2)} €`} icon={TrendingUp} color="bg-green-500" />
      </div>

      {/* Recent expedientes */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Últimos expedientes</h2>
        </div>
        <div className="divide-y">
          {expedientes?.slice(0, 5).map((exp: any) => (
            <div key={exp.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900 text-sm">{exp.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{exp.estado}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(exp.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
          ))}
          {!expedientes?.length && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Aún no tienes expedientes. <a href="/dashboard/expedientes" className="text-brand-600 hover:underline">Crear uno</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
