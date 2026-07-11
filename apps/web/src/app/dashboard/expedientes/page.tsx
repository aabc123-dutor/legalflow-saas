'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { expedientesApi, clientesApi } from '@/lib/api';
import Link from 'next/link';
import { FolderOpen, Plus, X } from 'lucide-react';

const ESTADO_COLOR: Record<string, string> = {
  ABIERTO: 'bg-green-100 text-green-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  PENDIENTE_CLIENTE: 'bg-amber-100 text-amber-700',
  ARCHIVADO: 'bg-gray-100 text-gray-500',
  CERRADO: 'bg-red-100 text-red-700',
};

const ESTADOS = ['ABIERTO', 'EN_CURSO', 'PENDIENTE_CLIENTE', 'ARCHIVADO', 'CERRADO'];

const schema = z.object({
  titulo: z.string().min(2, 'Introduce un título'),
  clienteId: z.string().uuid('Selecciona un cliente'),
  descripcion: z.string().optional(),
  estado: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function ExpedientesPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['expedientes'],
    queryFn: () => expedientesApi.list().then((r) => r.data),
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { estado: 'ABIERTO' },
  });

  const createMutation = useMutation({
    mutationFn: (data: Form) => expedientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedientes'] });
      setOpen(false);
      reset();
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expedientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tus asuntos y casos</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
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
                <p className="text-xs text-gray-500 mt-0.5">
                  {exp.cliente ? `${exp.cliente.nombre} ${exp.cliente.apellidos ?? ''}`.trim() : 'Sin cliente'}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                {exp.estado.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(exp.fechaApertura).toLocaleDateString('es-ES')}
              </span>
            </Link>
          ))}
          {data?.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No hay expedientes. Crea el primero.</div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo expediente</h2>
              <button onClick={() => { setOpen(false); reset(); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  {...register('titulo')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  {...register('clienteId')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes?.filter((c: any) => c.activo).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellidos ?? ''}
                    </option>
                  ))}
                </select>
                {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  {...register('estado')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {createMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  Error al crear el expediente. Inténtalo de nuevo.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); reset(); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}