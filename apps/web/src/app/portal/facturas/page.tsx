'use client';

import { useQuery } from '@tanstack/react-query';
import { documentosApi, expedientesApi, facturasApi } from '@/lib/api';
import { Receipt, Download } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

const ESTADO_COLOR: Record<string, string> = {
  EMITIDA: 'bg-blue-50 text-blue-700',
  PAGADA: 'bg-green-50 text-green-700',
  ANULADA: 'bg-gray-100 text-gray-400',
};

export default function PortalFacturasPage() {
  const { data: facturas, isLoading } = useQuery({
    queryKey: ['mis-facturas'],
    queryFn: () => expedientesApi.getMisFacturas().then((r) => r.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis facturas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Facturas emitidas por tu despacho</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        {!isLoading && facturas?.length === 0 && (
          <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Receipt className="w-10 h-10" />
            <p className="text-sm">No tienes facturas emitidas aún.</p>
          </div>
        )}
        {facturas?.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Número</th>
                <th className="px-6 py-3 font-medium">Expediente</th>
                <th className="px-6 py-3 font-medium">Emisión</th>
                <th className="px-6 py-3 font-medium">Vencimiento</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {facturas.map((f: any) => {
                const diasParaVencer = f.fechaVencimiento
                  ? Math.ceil((new Date(f.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const cercaDeVencer = diasParaVencer !== null && diasParaVencer <= 3 && f.estado !== 'PAGADA' && f.estado !== 'ANULADA';

                return (
                  <tr key={f.id} className={`hover:bg-gray-50 ${cercaDeVencer ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      {cercaDeVencer && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                      {f.numero}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{f.expediente?.titulo ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(f.fechaEmision).toLocaleDateString('es-ES')}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[f.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 text-right">
                      {Number(f.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="px-6 py-4 text-right">
                      {f.documento?.id && (
                        <button
                          onClick={async () => {
                            const { data } = await documentosApi.getDownloadUrl(f.documento.id);
                            window.open(data.url, '_blank');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}