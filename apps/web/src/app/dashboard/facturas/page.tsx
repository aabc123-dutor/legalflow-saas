'use client';
import { useQuery } from '@tanstack/react-query';
import { facturasApi } from '@/lib/api';
import { Receipt, Plus } from 'lucide-react';

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-500',
  EMITIDA: 'bg-blue-100 text-blue-700',
  PAGADA: 'bg-green-100 text-green-700',
  VENCIDA: 'bg-red-100 text-red-700',
  ANULADA: 'bg-gray-100 text-gray-400',
};

export default function FacturasPage() {
  const { data, isLoading } = useQuery({ queryKey: ['facturas'], queryFn: () => facturasApi.list().then((r) => r.data) });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de facturas emitidas</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Nueva factura
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Número</th>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Base imponible</th>
              <th className="px-6 py-3 font-medium">IVA</th>
              <th className="px-6 py-3 font-medium">IRPF</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((f: any) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-medium">{f.numero}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(f.fechaEmision).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4">{Number(f.baseImponible).toFixed(2)} €</td>
                <td className="px-6 py-4 text-green-600">+{Number(f.cuotaIva).toFixed(2)} €</td>
                <td className="px-6 py-4 text-red-600">-{Number(f.cuotaIrpf).toFixed(2)} €</td>
                <td className="px-6 py-4 font-semibold">{Number(f.total).toFixed(2)} €</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[f.estado]}`}>{f.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No hay facturas. Crea la primera.</div>}
      </div>
    </div>
  );
}
