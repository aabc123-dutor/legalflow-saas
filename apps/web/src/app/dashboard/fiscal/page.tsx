'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fiscalApi } from '@/lib/api';
import { Calculator } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Settings, Download } from 'lucide-react';

export default function FiscalPage() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const [editandoConfig, setEditandoConfig] = useState(false);
  const [trimestreModelo, setTrimestreModelo] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['fiscal-config'],
    queryFn: () => fiscalApi.getConfig().then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm({
    values: config ? {
      nif: config.nif ?? '',
      tipoIva: config.tipoIva ?? 21,
      tipoIrpf: config.tipoIrpf ?? 15,
      nuevoProfesional: config.nuevoProfesional ?? false,
      epigrafeCnae: config.epigrafeCnae ?? '',
      titulares: config.titulares ?? '',
      direccion: config.direccion ?? '',
      banco: config.banco ?? '',
      iban: config.iban ?? '',
      diasPago: config.diasPago ?? 7,
    } : undefined,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => fiscalApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
      setEditandoConfig(false);
    },
  });

  const { data: modelo303 } = useQuery({
    queryKey: ['modelo303', anio, trimestreModelo],
    queryFn: () => fiscalApi.modelo303(anio, trimestreModelo).then((r) => r.data),
  });

  const { data: modelo130 } = useQuery({
    queryKey: ['modelo130', anio, trimestreModelo],
    queryFn: () => fiscalApi.modelo130(anio, trimestreModelo).then((r) => r.data),
  });

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

  function exportarCSV(tipo: string, datos: any, anio: number, trimestre: number) {
    if (!datos) return;

    const filas = Object.entries(datos)
      .filter(([key]) => key !== 'trimestre' && key !== 'anio')
      .map(([key, value]) => `${key},${value}`);

    const csv = ['campo,valor', ...filas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo}_${anio}_Q${trimestre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

      {/* Configuración fiscal */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Configuración fiscal</h2>
          {!editandoConfig && (
            <button
              onClick={() => setEditandoConfig(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" /> Editar
            </button>
          )}
        </div>

        {!editandoConfig ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">NIF / CIF</span>
              <span className="font-medium">{config?.nif || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Titulares</span>
              <span className="font-medium text-right">{config?.titulares || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Tipo de IVA</span>
              <span className="font-medium">{config?.tipoIva ?? 21}%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Dirección</span>
              <span className="font-medium text-right">{config?.direccion || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Tipo de IRPF</span>
              <span className="font-medium">{config?.nuevoProfesional ? '7% (nuevo profesional)' : `${config?.tipoIrpf ?? 15}%`}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Banco</span>
              <span className="font-medium">{config?.banco || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Epígrafe IAE/CNAE</span>
              <span className="font-medium">{config?.epigrafeCnae || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">IBAN</span>
              <span className="font-medium">{config?.iban || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500"></span>
              <span></span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Días para el pago</span>
              <span className="font-medium">{config?.diasPago ?? 7} días</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => updateConfigMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIF / CIF</label>
                <input {...register('nif')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Epígrafe IAE/CNAE</label>
                <input {...register('epigrafeCnae')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de IVA (%)</label>
                <input {...register('tipoIva', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de IRPF (%)</label>
                <input {...register('tipoIrpf', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input {...register('nuevoProfesional')} type="checkbox" id="nuevoProfesional" className="rounded border-gray-300" />
              <label htmlFor="nuevoProfesional" className="text-sm text-gray-700">Nuevo profesional (IRPF reducido al 7%)</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulares</label>
              <input {...register('titulares')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input {...register('direccion')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                <input {...register('banco')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Días para el pago</label>
                <input {...register('diasPago', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input {...register('iban')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setEditandoConfig(false); reset(); }} className="px-4 py-2 text-sm text-gray-600">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateConfigMutation.isPending}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
              >
                {updateConfigMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Selector de trimestre para los modelos */}
      <div className="mt-8 mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Modelos oficiales — trimestre:</span>
        {[1, 2, 3, 4].map((q) => (
          <button
            key={q}
            onClick={() => setTrimestreModelo(q)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${trimestreModelo === q ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
          >
            Q{q}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Modelo 303 */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Modelo 303 — IVA</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{trimestreModelo}º Trimestre</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Base imponible</span>
              <span className="font-medium">{(modelo303?.baseImponible ?? 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Cuota devengada (repercutida)</span>
              <span className="font-medium text-green-600">{(modelo303?.cuotaDevengada ?? 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Cuota deducible</span>
              <span className="font-medium">{(modelo303?.cuotaDeducible ?? 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-baseline border-t pt-3 mt-2">
              <span className="font-medium text-gray-900">Resultado a ingresar</span>
              <span className="text-lg font-bold text-gray-900">{(modelo303?.resultadoLiquidar ?? 0).toFixed(2)} €</span>
            </div>
          </div>
          <button
            onClick={() => exportarCSV('modelo303', modelo303, anio, trimestreModelo)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Exportar resumen
          </button>
        </div>

        {/* Modelo 130 */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Modelo 130 — IRPF</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Acumulado Q1-Q{trimestreModelo}</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Base acumulada</span>
              <span className="font-medium">{(modelo130?.baseAcumulada ?? 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Retenciones ya practicadas</span>
              <span className="font-medium text-red-500">-{(modelo130?.retencionesAcumuladas ?? 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-baseline border-t pt-3 mt-2">
              <span className="font-medium text-gray-900">Pago fraccionado</span>
              <span className="text-lg font-bold text-gray-900">{(modelo130?.pagoFraccionado ?? 0).toFixed(2)} €</span>
            </div>
          </div>
          <button
            onClick={() => exportarCSV('modelo130', modelo130, anio, trimestreModelo)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Exportar resumen
          </button>
        </div>
      </div>

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
