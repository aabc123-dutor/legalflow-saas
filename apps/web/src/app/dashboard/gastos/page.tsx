'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { gastosApi } from '@/lib/api';
import { Plus, X, Paperclip, Trash2, Pencil, Repeat, Info } from 'lucide-react';

const CATEGORIAS: { value: string; label: string }[] = [
  { value: 'ALQUILER', label: 'Alquiler y arrendamientos' },
  { value: 'SUMINISTROS', label: 'Suministros (luz, agua, internet…)' },
  { value: 'MATERIAL_OFICINA', label: 'Material de oficina' },
  { value: 'SERVICIOS_PROFESIONALES', label: 'Servicios profesionales' },
  { value: 'CUOTA_AUTONOMOS', label: 'Cuota de autónomos / SS' },
  { value: 'COLEGIO_PROFESIONAL', label: 'Colegio profesional' },
  { value: 'SEGUROS', label: 'Seguros' },
  { value: 'SOFTWARE_SUSCRIPCIONES', label: 'Software y suscripciones' },
  { value: 'FORMACION', label: 'Formación' },
  { value: 'PUBLICIDAD', label: 'Publicidad y marketing' },
  { value: 'MANUTENCION', label: 'Manutención y dietas' },
  { value: 'VEHICULO_DESPLAZAMIENTO', label: 'Vehículo y desplazamientos' },
  { value: 'GASTOS_FINANCIEROS', label: 'Gastos financieros' },
  { value: 'TRIBUTOS', label: 'Tributos (IAE, tasas)' },
  { value: 'AMORTIZACION', label: 'Amortización' },
  { value: 'OTROS', label: 'Otros' },
];
const LABEL: Record<string, string> = Object.fromEntries(CATEGORIAS.map((c) => [c.value, c.label]));
const FREC_LABEL: Record<string, string> = {
  MENSUAL: 'Mensual', TRIMESTRAL: 'Trimestral', CUATRIMESTRAL: 'Cuatrimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual',
};
const eur = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const toInput = (d?: string | null) => (d ? new Date(d).toISOString().split('T')[0] : '');

const schema = z.object({
  fecha: z.string().min(1, 'Introduce la fecha'),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  proveedor: z.string().min(1, 'Introduce el proveedor'),
  nifProveedor: z.string().optional(),
  numeroFactura: z.string().optional(),
  baseImponible: z.coerce.number().min(0, 'Base inválida'),
  tipoIva: z.coerce.number().min(0).max(100),
  deducible: z.boolean(),
  ivaDeduciblePct: z.coerce.number().min(0).max(100),
  irpfDeduciblePct: z.coerce.number().min(0).max(100),
  recurrente: z.boolean(),
  frecuencia: z.string().optional(),
  fechaFin: z.string().optional(),
  notas: z.string().optional(),
}).refine(
  (d) => !d.recurrente || !d.fechaFin || d.fechaFin >= d.fecha,
  { message: 'La fecha de fin no puede ser anterior a la de inicio', path: ['fechaFin'] },
);
type Form = z.infer<typeof schema>;

const nuevoGasto: Form = {
  fecha: new Date().toISOString().split('T')[0],
  categoria: 'OTROS', proveedor: '', nifProveedor: '', numeroFactura: '',
  baseImponible: 0, tipoIva: 21, deducible: true, ivaDeduciblePct: 100, irpfDeduciblePct: 100,
  recurrente: false, frecuencia: '', fechaFin: '', notas: '',
};


export default function GastosPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [justName, setJustName] = useState<string | null>(null);
  const [editRec, setEditRec] = useState<any | null>(null);
  const [recFin, setRecFin] = useState('');
  const [ayuda, setAyuda] = useState(false);
  const [recEditId, setRecEditId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const invalidarTodo = () => {
    queryClient.invalidateQueries({ queryKey: ['gastos'] });
    queryClient.invalidateQueries({ queryKey: ['gastos-recurrentes'] });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['gastos'],
    queryFn: () => gastosApi.list().then((r) => r.data),
  });

  const { data: plantillas } = useQuery({
    queryKey: ['gastos-recurrentes'],
    queryFn: () => gastosApi.recurrentes().then((r) => r.data),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: nuevoGasto,
  });

  const base = Number(watch('baseImponible')) || 0;
  const tipoIva = Number(watch('tipoIva')) || 0;
  const recurrente = watch('recurrente');
  const cuotaIvaPreview = +(base * tipoIva / 100).toFixed(2);
  const fechaInicio = watch('fecha');

  function abrirNuevo() {
    setEditingId(null);
    setFile(null);
    reset(nuevoGasto);
    setOpen(true);
    setJustName(null);
  }

  function abrirEdicion(g: any) {
    setEditingId(g.id);
    setFile(null);
    reset({
      fecha: toInput(g.fecha),
      categoria: g.categoria,
      proveedor: g.proveedor,
      nifProveedor: g.nifProveedor ?? '',
      numeroFactura: g.numeroFactura ?? '',
      baseImponible: Number(g.baseImponible),
      tipoIva: Number(g.tipoIva),
      deducible: g.deducible,
      ivaDeduciblePct: Number(g.ivaDeduciblePct),
      irpfDeduciblePct: Number(g.irpfDeduciblePct),
      recurrente: false,           // las ocurrencias no gestionan recurrencia
      frecuencia: '',
      fechaFin: '',
      notas: g.notas ?? '',
    });
    setOpen(true);
    setJustName(g.justificanteNombre ?? null);
  }

  function cerrar() {
    setOpen(false);
    setEditingId(null);
    setRecEditId(null);
    setFile(null);
    reset(nuevoGasto);
    setJustName(null);
  }

  const guardarMutation = useMutation({
    mutationFn: (d: Form) => {
      const payload = {
        ...d,
        frecuencia: d.recurrente ? (d.frecuencia || null) : null,
        fechaFin: d.recurrente ? (d.fechaFin || null) : null,
      };
      if (recEditId) return gastosApi.reemplazarRecurrente(recEditId, { ...payload, recurrente: true });
      return editingId ? gastosApi.update(editingId, payload) : gastosApi.create(payload);
    },
    onSuccess: async (res) => {
      const id = editingId ?? res.data.id;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        try { await gastosApi.uploadJustificante(id, fd); } catch { /* no bloquea el guardado */ }
      }
      invalidarTodo();
      cerrar();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gastosApi.delete(id),
    onSuccess: () => invalidarTodo(),
    onError: (e: any) => alert(e?.response?.data?.message ?? 'No se pudo eliminar el gasto.'),
  });

  const borrarJustMutation = useMutation({
    mutationFn: () => gastosApi.deleteJustificante(editingId!),
    onSuccess: () => { setJustName(null); invalidarTodo(); },
  });

  const actualizarRecMutation = useMutation({
    mutationFn: (vars: { id: string; fechaFin: string | null }) => gastosApi.update(vars.id, { fechaFin: vars.fechaFin }),
    onSuccess: () => { invalidarTodo(); setEditRec(null); },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'No se pudo actualizar el gasto recurrente.'),
  });

  const eliminarRecMutation = useMutation({
    mutationFn: (id: string) => gastosApi.eliminarRecurrente(id),
    onSuccess: () => invalidarTodo(),
    onError: (e: any) => alert(e?.response?.data?.message ?? 'No se pudo eliminar el gasto recurrente.'),
  });

  async function verJustificante(id: string) {
    const { data } = await gastosApi.getJustificanteUrl(id);
    window.open(data.url, '_blank');
  }

  function abrirRecurrente(p: any) {
    setEditRec(p);
    setRecFin(toInput(p.fechaFin));
  }

  function abrirRecEdicion(p: any) {
    setEditingId(null);
    setRecEditId(p.id);
    setFile(null);
    setJustName(p.justificanteNombre ?? null);
    reset({
      fecha: new Date().toISOString().split('T')[0], // "Aplicar desde": hoy por defecto (seguro: no reescribe el pasado)
      categoria: p.categoria,
      proveedor: p.proveedor,
      nifProveedor: p.nifProveedor ?? '',
      numeroFactura: p.numeroFactura ?? '',
      baseImponible: Number(p.baseImponible),
      tipoIva: Number(p.tipoIva),
      deducible: p.deducible,
      ivaDeduciblePct: Number(p.ivaDeduciblePct),
      irpfDeduciblePct: Number(p.irpfDeduciblePct),
      recurrente: true,
      frecuencia: p.frecuencia ?? 'MENSUAL',
      fechaFin: toInput(p.fechaFin),
      notas: p.notas ?? '',
    });
    setOpen(true);
  }

  function estadoRecurrente(p: any): { texto: string; clase: string } {
    if (!p.fechaFin) return { texto: 'Indefinido', clase: 'bg-green-100 text-green-700' };
    const fin = new Date(p.fechaFin);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return fin < hoy
      ? { texto: `Finalizado ${fin.toLocaleDateString('es-ES')}`, clase: 'bg-gray-100 text-gray-500' }
      : { texto: `Hasta ${fin.toLocaleDateString('es-ES')}`, clase: 'bg-amber-100 text-amber-700' };
  }

  const totalGastos = data?.reduce((s: number, g: any) => s + Number(g.total), 0) ?? 0;
  const ivaDeducible = data?.reduce((s: number, g: any) => s + (g.deducible ? Number(g.cuotaIva) * Number(g.ivaDeduciblePct) / 100 : 0), 0) ?? 0;
  const baseDeducible = data?.reduce((s: number, g: any) => s + (g.deducible ? Number(g.baseImponible) * Number(g.irpfDeduciblePct) / 100 : 0), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gastos deducibles del despacho (IVA soportado e IRPF)</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo gasto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500 mb-1">Total gastos</p>
          <p className="text-2xl font-bold text-gray-900">{eur(totalGastos)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500 mb-1">IVA soportado deducible</p>
          <p className="text-2xl font-bold text-green-600">{eur(ivaDeducible)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500 mb-1">Base deducible (IRPF)</p>
          <p className="text-2xl font-bold text-brand-600">{eur(baseDeducible)}</p>
        </div>
      </div>

      {/* Gastos recurrentes (plantillas) */}
      {plantillas && plantillas.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Repeat className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-gray-900">Gastos recurrentes</h2>
            <button type="button" onClick={() => setAyuda((v) => !v)} title="Cómo funcionan" className="text-gray-400 hover:text-brand-600">
              <Info className="w-4 h-4" />
            </button>
          </div>
          {ayuda && (
            <div className="px-6 py-4 bg-blue-50 border-b text-xs text-gray-600 space-y-1.5">
              <p><strong>Cómo funcionan.</strong> Se genera un gasto real por periodo, desde la fecha de inicio hasta hoy (o hasta la fecha de fin). Cada uno cuenta en el 303/130 y admite su propio justificante.</p>
              <p><strong>¿Cambia el importe?</strong> Edítalo (✏️) indicando <em>Aplicar desde</em> la fecha del cambio: se conserva el histórico y el nuevo importe rige a partir de ahí.</p>
              <p><strong>¿Te has equivocado al crearlo?</strong> Edítalo (✏️) poniendo <em>Aplicar desde</em> = su fecha de inicio original: se borra lo generado y se recrea con los datos correctos.</p>
              <p><strong>¿Ya no lo tienes?</strong> Dale de baja (↻) con una fecha de fin. Los gastos ya generados se conservan.</p>
              <p><strong>¿Nunca debió existir?</strong> Elimínalo por completo (🗑): borra también los gastos generados y cambia el 303/130 de esos trimestres.</p>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Fecha</th>
                <th className="px-6 py-3 font-medium">Proveedor</th>
                <th className="px-6 py-3 font-medium">Categoría</th>
                <th className="px-6 py-3 font-medium">Frecuencia</th>
                <th className="px-6 py-3 font-medium text-right">Base</th>
                <th className="px-6 py-3 font-medium text-right">IVA</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium">Deducible</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plantillas.map((p: any) => {
                const est = estadoRecurrente(p);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(p.fecha).toLocaleDateString('es-ES')}</td>
                    <td className="px-6 py-4 text-gray-800">
                      <div className="font-medium">{p.proveedor}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{LABEL[p.categoria] ?? p.categoria}</td>
                    <td className="px-6 py-4 text-gray-500">{FREC_LABEL[p.frecuencia] ?? p.frecuencia}</td>
                    <td className="px-6 py-4 text-right">{eur(Number(p.baseImponible))}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{eur(Number(p.cuotaIva))}</td>
                    <td className="px-6 py-4 text-right font-semibold">{eur(Number(p.total))}</td>
                    <td className="px-6 py-4">
                      {p.deducible
                        ? <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">{Number(p.ivaDeduciblePct)}% / {Number(p.irpfDeduciblePct)}%</span>
                        : <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 font-medium">No</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${est.clase}`}>{est.texto}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {p.justificanteNombre && (
                          <button onClick={() => verJustificante(p.id)} title="Ver justificante" className="text-gray-400 hover:text-brand-600">
                            <Paperclip className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => abrirRecurrente(p)} title="Gestionar / dar de baja" className="text-gray-400 hover:text-brand-600">
                          <Repeat className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirRecEdicion(p)} title="Editar (aplica desde una fecha)" className="text-gray-400 hover:text-brand-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const n = p._count?.ocurrencias ?? 0;
                            if (confirm(
                              `Se eliminará el gasto recurrente y sus ${n} gasto(s) ya generados.\n` +
                              `Esto cambiará el cálculo del 303/130 de los trimestres afectados.\n\n` +
                              `Si simplemente has dejado de tenerlo, usa "Dar de baja" (↻) para conservar el histórico.\n\n` +
                              `¿Eliminar por completo?`
                            )) eliminarRecMutation.mutate(p.id);
                          }}
                          title="Eliminar por completo"
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de gastos */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Proveedor</th>
              <th className="px-6 py-3 font-medium">Categoría</th>
              <th className="px-6 py-3 font-medium text-right">Base</th>
              <th className="px-6 py-3 font-medium text-right">IVA</th>
              <th className="px-6 py-3 font-medium text-right">Total</th>
              <th className="px-6 py-3 font-medium">Deducible</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((g: any) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500">{new Date(g.fecha).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4 text-gray-800">
                  <div className="font-medium">{g.proveedor}</div>
                </td>
                <td className="px-6 py-4 text-gray-500">{LABEL[g.categoria] ?? g.categoria}</td>
                <td className="px-6 py-4 text-right">{eur(Number(g.baseImponible))}</td>
                <td className="px-6 py-4 text-right text-gray-500">{eur(Number(g.cuotaIva))}</td>
                <td className="px-6 py-4 text-right font-semibold">{eur(Number(g.total))}</td>
                <td className="px-6 py-4">
                  {g.deducible
                    ? <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">{Number(g.ivaDeduciblePct)}% / {Number(g.irpfDeduciblePct)}%</span>
                    : <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 font-medium">No</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    {g.justificanteNombre && (
                      <button onClick={() => verJustificante(g.id)} title="Ver justificante" className="text-gray-400 hover:text-brand-600">
                        <Paperclip className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => abrirEdicion(g)} title="Editar" className="text-gray-400 hover:text-brand-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Eliminar este gasto?')) deleteMutation.mutate(g.id); }}
                      title="Eliminar"
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No hay gastos. Registra el primero.</div>}
      </div>

      {/* Modal alta/edición */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{recEditId ? 'Editar gasto recurrente' : editingId ? 'Editar gasto' : 'Nuevo gasto'}</h2>
              <button onClick={cerrar}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => guardarMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{recEditId ? 'Aplicar desde *' : 'Fecha *'}</label>
                  <input {...register('fecha')} type="date" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select {...register('categoria')} className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              {recEditId && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg">
                  Se cerrará el recurrente actual el día anterior a esa fecha (conservando los gastos ya generados) y se creará uno nuevo con estos valores.
                  Si indicas su fecha de inicio original, se sustituirá por completo y se regenerarán todas las ocurrencias.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                  <input {...register('proveedor')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  {errors.proveedor && <p className="text-xs text-red-500 mt-1">{errors.proveedor.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIF proveedor</label>
                  <input {...register('nifProveedor')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base (€) *</label>
                  <input {...register('baseImponible')} type="number" step="0.01" min="0" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  {errors.baseImponible && <p className="text-xs text-red-500 mt-1">{errors.baseImponible.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo IVA (%)</label>
                  <input {...register('tipoIva')} type="number" step="0.01" min="0" max="100" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº factura</label>
                  <input {...register('numeroFactura')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input {...register('deducible')} type="checkbox" id="deducible" className="rounded border-gray-300" />
                <label htmlFor="deducible" className="text-sm text-gray-700">Gasto deducible</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% deducible IVA</label>
                  <input {...register('ivaDeduciblePct')} type="number" step="1" min="0" max="100" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% deducible IRPF</label>
                  <input {...register('irpfDeduciblePct')} type="number" step="1" min="0" max="100" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              {/* Recurrencia: solo al crear (después se gestiona en "Gastos recurrentes") */}
              {!editingId && !recEditId && (
                <div className="flex items-center gap-2">
                  <input {...register('recurrente')} type="checkbox" id="recurrente" className="rounded border-gray-300" />
                  <label htmlFor="recurrente" className="text-sm text-gray-700">Gasto recurrente</label>
                </div>
              )}
              {(recEditId || (!editingId && recurrente)) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                    <select {...register('frecuencia')} className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="MENSUAL">Mensual</option>
                      <option value="TRIMESTRAL">Trimestral</option>
                      <option value="CUATRIMESTRAL">Cuatrimestral</option>
                      <option value="SEMESTRAL">Semestral</option>
                      <option value="ANUAL">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin (opcional)</label>
                    <input {...register('fechaFin')} type="date" min={fechaInicio} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    {errors.fechaFin && <p className="text-xs text-red-500 mt-1">{errors.fechaFin.message}</p>}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 text-right">
                IVA soportado: {eur(cuotaIvaPreview)} · Total: {eur(base + cuotaIvaPreview)}
              </p>

              {/* Justificante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justificante (PDF/JPG/PNG)</label>

                {editingId && justName && (
                  <div className="flex items-center justify-between text-sm bg-gray-50 border rounded-lg px-3 py-2 mb-2">
                    <button type="button" onClick={() => verJustificante(editingId)} className="inline-flex items-center gap-2 text-brand-600 hover:underline">
                      <Paperclip className="w-4 h-4" /> {justName}
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm('¿Eliminar el justificante?')) borrarJustMutation.mutate(); }}
                      disabled={borrarJustMutation.isPending}
                      title="Eliminar justificante"
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {editingId && (
                  <p className="text-xs text-gray-400 mt-1">
                    {justName ? 'Sube un archivo para reemplazar el actual.' : 'Sube un archivo para adjuntar el justificante.'}
                  </p>
                )}
              </div>

              {guardarMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  Error al guardar el gasto. Inténtalo de nuevo.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardarMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
                >
                  {guardarMutation.isPending ? 'Guardando...' : ((editingId || recEditId) ? 'Guardar cambios' : 'Guardar gasto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gestionar recurrente (fecha fin / baja) */}
      {editRec && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Gasto recurrente</h2>
              <button onClick={() => setEditRec(null)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {editRec.proveedor} · {FREC_LABEL[editRec.frecuencia] ?? editRec.frecuencia} · {eur(Number(editRec.total))}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
            <input
              type="date"
              value={recFin}
              min={toInput(editRec.fecha)}
              onChange={(e) => setRecFin(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setRecFin(new Date().toISOString().split('T')[0])}
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                Dar de baja hoy
              </button>
              <button
                type="button"
                onClick={() => setRecFin('')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Sin fecha de fin (indefinido)
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Al fijar una fecha de fin, se eliminan las ocurrencias posteriores; si la amplías, se generan las que falten.
            </p>

            <div className="flex justify-end gap-3 pt-5">
              <button type="button" onClick={() => setEditRec(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button
                type="button"
                disabled={actualizarRecMutation.isPending}
                onClick={() => actualizarRecMutation.mutate({ id: editRec.id, fechaFin: recFin || null })}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
              >
                {actualizarRecMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}