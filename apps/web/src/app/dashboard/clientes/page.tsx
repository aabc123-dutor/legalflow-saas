'use client';
import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '@/lib/api';
import { Users, Plus } from 'lucide-react';

export default function ClientesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['clientes'], queryFn: () => clientesApi.list().then((r) => r.data) });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Directorio de clientes del despacho</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Nombre</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Teléfono</th>
              <th className="px-6 py-3 font-medium">NIF</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{c.nombre} {c.apellidos}</td>
                <td className="px-6 py-4 text-gray-500">{c.email ?? '—'}</td>
                <td className="px-6 py-4 text-gray-500">{c.telefono ?? '—'}</td>
                <td className="px-6 py-4 text-gray-500">{c.nif ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No hay clientes registrados.</div>}
      </div>
    </div>
  );
}
