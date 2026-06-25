'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { facturasApi } from '@/lib/api';
import { ArrowLeft, Plus, X, Trash2, Check, Pencil } from 'lucide-react';
import Link from 'next/link';

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-500',
  EMITIDA: 'bg-blue-100 text-blue-700',
  PAGADA: 'bg-green-100 text-green-700',
  VENCIDA: 'bg-red-100 text-red-700',
  ANULADA: 'bg-gray-100 text-gray-400',
};

export default function FacturaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [modalSuplido, setModalSuplido] = useState(false);
  const [confirmEstado, setConfirmEstado] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  const { data: factura, isLoading } = useQuery({
    queryKey: ['factura', id],
    queryFn: () => facturasApi.get(id).then((r) => r.data),
  });

  const editForm = useForm({
    values: factura ? {
      numero: factura.numero,
      fechaVencimiento: factura.fechaVencimiento ? factura.fechaVencimiento.split('T')[0] : '',
      notas: factura.notas ?? '',
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => facturasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factura', id] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      setConfirmEstado(null);
      setEditando(false);
    },
  });

  const suplidoForm = useForm<{ concepto: string; importe: number }>();

  const createSuplidoMutation = useMutation({
    mutationFn: (data: any) => facturasApi.createSuplido(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factura', id] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      setModalSuplido(false);
      suplidoForm.reset();
    },
  });

  const deleteSuplidoMutation = useMutation({
    mutationFn: (suplidoId: string) => facturasApi.deleteSuplido(suplidoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factura', id] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>;
  if (!factura) return <div className="p-8 text-center text-gray-400 text-sm">Factura no encontrada.</div>;

  const cliente = factura.expediente?.cliente;
  const totalSuplidos = factura.suplidos?.reduce((s: number, sup: any) => s + Number(sup.importe), 0) ?? 0;
  const esEmpresa = cliente?.empresa ?? false;
  const esBorrador = factura.estado === 'BORRADOR';

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard/facturas" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft className="w-4 h-4" /> Facturas
          </Link>
          {editando ? (
            <input
              {...editForm.register('numero')}
              className="text-2xl font-bold text-gray-900 border-b border-brand-400 focus:outline-none bg-transparent"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{factura.numero}</h1>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[factura.estado]}`}>
              {factura.estado}
            </span>
            <span className="text-xs text-gray-400">
              Emitida el {new Date(factura.fechaEmision).toLocaleDateString('es-ES')}
            </span>
            {factura.fechaVencimiento && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-red-500">
                  Vence el {new Date(factura.fechaVencimiento).toLocaleDateString('es-ES')}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {esBorrador && !editando && (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
          )}
          {editando && (
            <>
              <button onClick={() => setEditando(false)} className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={editForm.handleSubmit((d) => updateMutation.mutate(d))}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
          {!editando && factura.estado !== 'PAGADA' && factura.estado !== 'ANULADA' && (
            <>
              {confirmEstado ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">¿Marcar como {confirmEstado}?</span>
                  <button
                    onClick={() => updateMutation.mutate({ estado: confirmEstado })}
                    className="px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
                  >
                    Confirmar
                  </button>
                  <button onClick={() => setConfirmEstado(null)} className="px-3 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  {factura.estado === 'BORRADOR' && (
                    <button
                      onClick={() => setConfirmEstado('EMITIDA')}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Marcar emitida
                    </button>
                  )}
                  {factura.estado === 'EMITIDA' && (
                    <button
                      onClick={() => setConfirmEstado('PAGADA')}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50"
                    >
                      <Check className="w-4 h-4" /> Marcar pagada
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmEstado('ANULADA')}
                    className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Anular
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Datos + Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Datos de la factura</p>
          <div className="space-y-0 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-blue-600">
                {cliente ? `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim() : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Expediente</span>
              <span className="font-medium">{factura.expediente?.titulo ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Fecha emisión</span>
              <span className="font-medium">{new Date(factura.fechaEmision).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Fecha vencimiento</span>
              {editando ? (
                <input
                  type="date"
                  {...editForm.register('fechaVencimiento')}
                  className="text-sm border rounded px-2 py-1"
                />
              ) : (
                <span className="font-medium">
                  {factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-ES') : '—'}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Retención IRPF</span>
              {esEmpresa
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Sí (empresa)</span>
                : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">No (particular)</span>
              }
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Resumen económico</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Honorarios</span>
              <span>{Number(factura.baseImponible).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            {totalSuplidos > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Suplidos</span>
                <span>{totalSuplidos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 border-t pt-2">
              <span>Base imponible</span>
              <span>{Number(factura.baseImponible).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>+ IVA ({Number(factura.tipoIva).toFixed(0)}%)</span>
              <span>+{Number(factura.cuotaIva).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            {Number(factura.cuotaIrpf) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>- IRPF ({Number(factura.tipoIrpf).toFixed(0)}%)</span>
                <span>-{Number(factura.cuotaIrpf).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
            )}
            <div className="flex justify-between items-baseline border-t pt-3 mt-2">
              <span className="text-base font-medium text-gray-900">Total a cobrar</span>
              <span className="text-2xl font-bold text-gray-900">
                {Number(factura.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            {totalSuplidos > 0 && (
              <p className="text-xs text-gray-400 text-right">Suplidos no sujetos a IVA/IRPF</p>
            )}
          </div>
        </div>
      </div>

      {/* Suplidos */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Suplidos</p>
          {esBorrador && (
            <button
              onClick={() => setModalSuplido(true)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 border border-brand-200 rounded-lg px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
          )}
        </div>

        {factura.suplidos?.length === 0 && (
          <p className="text-sm text-gray-400">Sin suplidos.</p>
        )}

        <div className="divide-y">
          {factura.suplidos?.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 py-3 text-sm">
              <span className="flex-1 text-gray-800">{s.concepto}</span>
              <span className="font-medium">{Number(s.importe).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              {esBorrador && (
                <button onClick={() => deleteSuplidoMutation.mutate(s.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {factura.suplidos?.length > 0 && (
          <div className="flex justify-end gap-4 text-sm border-t pt-3 mt-1">
            <span className="text-gray-500">Total suplidos</span>
            <span className="font-medium">{totalSuplidos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Notas</p>
        {editando ? (
          <textarea
            {...editForm.register('notas')}
            rows={3}
            className="w-full text-sm border rounded-lg p-2 focus:outline-none resize-none"
          />
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            {factura.notas || <span className="text-gray-400">Sin notas.</span>}
          </p>
        )}
      </div>

      {/* Modal suplido */}
      {modalSuplido && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo suplido</h2>
              <button onClick={() => { setModalSuplido(false); suplidoForm.reset(); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={suplidoForm.handleSubmit((d) => createSuplidoMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
                <input
                  {...suplidoForm.register('concepto', { required: true })}
                  placeholder="Ej: Tasa judicial, Notaría..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importe *</label>
                <div className="relative">
                  <input
                    {...suplidoForm.register('importe', { required: true, valueAsNumber: true, min: 0 })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-400">€</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setModalSuplido(false); suplidoForm.reset(); }} className="px-4 py-2 text-sm text-gray-600">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSuplidoMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
                >
                  {createSuplidoMutation.isPending ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}