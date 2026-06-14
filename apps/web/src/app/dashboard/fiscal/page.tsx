'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fiscalApi } from '@/lib/api';
import { Calculator } from 'lucide-react';

export default function FiscalPage() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);

  const { data: resumen } = useQuery({
    queryKey: ['fiscal-resumen', anio],
    queryFn: () => fiscalApi.resumen(anio).then((r) => r.data),
  });

  const TRIMESTRES = ['Q1 (Ene-Mar)', 'Q2 (Abr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dic)'];

  const totales = resumen?.reduce(
    (acc: any, t: any) => ({
      base: acc.base + t.baseImponible,
      iva: acc.iva + t.cuotaIva,
      irpf: acc.irpf + t.cuotaIrpf,
      total: acc.total + t.totalFacturado,
    }),
    { base: 0, iva: 0, irpf: 0, total: 0 },
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Fiscal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modelos 303 y 130 · IVA · IRPF</p>
        </div>
        <select value={anio} onChange={(e) => setAnio(+e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Totales anuales */}
      {totales && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Base imponible', value: totales.base, color: 'text-gray-900' },
            { label: 'IVA repercutido', value: totales.iva, color: 'text-green-600' },
            { label: 'IRPF retenido', value: totales.irpf, color: 'text-red-500' },
            { label: 'Total facturado', value: totales.total, color: 'text-brand-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value.toFixed(2)} €</p>
            </div>
          ))}
        </div>
      )}

      {/* Por trimestre */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Desglose trimestral {anio}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Trimestre</th>
              <th className="px-6 py-3 font-medium">Facturas</th>
              <th className="px-6 py-3 font-medium">Base imponible</th>
              <th className="px-6 py-3 font-medium">IVA (303)</th>
              <th className="px-6 py-3 font-medium">IRPF (130)</th>
              <th className="px-6 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4].map((q) => {
              const t = resumen?.find((r: any) => r.trimestre === q);
              return (
                <tr key={q} className={t ? '' : 'opacity-40'}>
                  <td className="px-6 py-4 font-medium">{TRIMESTRES[q - 1]}</td>
                  <td className="px-6 py-4 text-gray-500">{t?.numFacturas ?? 0}</td>
                  <td className="px-6 py-4">{(t?.baseImponible ?? 0).toFixed(2)} €</td>
                  <td className="px-6 py-4 text-green-600">+{(t?.cuotaIva ?? 0).toFixed(2)} €</td>
                  <td className="px-6 py-4 text-red-500">-{(t?.cuotaIrpf ?? 0).toFixed(2)} €</td>
                  <td className="px-6 py-4 font-semibold">{(t?.totalFacturado ?? 0).toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
