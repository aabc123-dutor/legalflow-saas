'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { facturasApi, expedientesApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-500',
  EMITIDA: 'bg-blue-100 text-blue-700',
  PAGADA: 'bg-green-100 text-green-700',
  VENCIDA: 'bg-red-100 text-red-700',
  ANULADA: 'bg-gray-100 text-gray-400',
};

const schema = z.object({
  expedienteId: z.string().uuid('Selecciona un expediente'),
  baseImponible: z.coerce.number().min(0, 'Importe inválido'),
  fechaEmision: z.string().min(1, 'Introduce la fecha de emisión'),
  fechaVencimiento: z.string().optional(),
  notas: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function FacturasPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => facturasApi.list().then((r) => r.data),
  });

  const { data: expedientes } = useQuery({
    queryKey: ['expedientes'],
    queryFn: () => expedientesApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { fechaEmision: new Date().toISOString().split('T')[0] },
  });

  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (data: Form) => facturasApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      setOpen(false);
      reset();
      router.push(`/dashboard/facturas/${res.data.id}`);
    },
  });



  const totalCobrado = data?.filter((f: any) => f.estado === 'PAGADA').reduce((s: number, f: any) => s + Number(f.total), 0) ?? 0;
  const totalPendiente = data?.filter((f: any) => f.estado === 'EMITIDA').reduce((s: number, f: any) => s + Number(f.total), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de facturas emitidas</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva factura
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500 mb-1">Total cobrado</p>
          <p className="text-2xl font-bold text-green-600">{totalCobrado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500 mb-1">Pendiente de cobro</p>
          <p className="text-2xl font-bold text-amber-600">{totalPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Número</th>
              <th className="px-6 py-3 font-medium">Cliente</th>
              <th className="px-6 py-3 font-medium">Expediente</th>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((f: any) => (
              <tr key={f.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/facturas/${f.id}`} className="font-mono font-medium text-brand-600 hover:underline">
                    {f.numero}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {f.expediente?.cliente ? `${f.expediente.cliente.nombre} ${f.expediente.cliente.apellidos ?? ''}`.trim() : '—'}
                </td>
                <td className="px-6 py-4 text-gray-500">{f.expediente?.titulo ?? '—'}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(f.fechaEmision).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4 font-semibold">{Number(f.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[f.estado]}`}>{f.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No hay facturas. Crea la primera.</div>}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Nueva factura</h2>
              <button onClick={() => { setOpen(false); reset(); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expediente *</label>
                <select
                  {...register('expedienteId')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Selecciona un expediente</option>
                  {expedientes?.filter((e: any) => e.estado !== 'CERRADO' && e.estado !== 'ARCHIVADO').map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.titulo} — {e.cliente ? `${e.cliente.nombre} ${e.cliente.apellidos ?? ''}`.trim() : ''}
                    </option>
                  ))}
                </select>
                {errors.expedienteId && <p className="text-xs text-red-500 mt-1">{errors.expedienteId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base imponible (honorarios) *</label>
                <div className="relative">
                  <input
                    {...register('baseImponible')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-400">€</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">IVA (21%) e IRPF se calculan automáticamente según el tipo de cliente.</p>
                {errors.baseImponible && <p className="text-xs text-red-500 mt-1">{errors.baseImponible.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de emisión *</label>
                  <input
                    {...register('fechaEmision')}
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.fechaEmision && <p className="text-xs text-red-500 mt-1">{errors.fechaEmision.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                  <input
                    {...register('fechaVencimiento')}
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  {...register('notas')}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {createMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  Error al crear la factura. Inténtalo de nuevo.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); reset(); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}