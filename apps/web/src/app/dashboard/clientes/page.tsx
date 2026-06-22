'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clientesApi } from '@/lib/api';
import { Plus, X } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(2, 'Introduce el nombre'),
  apellidos: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  nif: z.string().optional(),
  direccion: z.string().optional(),
  empresa: z.boolean().optional(),
  notas: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function ClientesPage() {
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { empresa: false },
  });

  const openCrear = () => {
    setSelectedCliente(null);
    reset({ nombre: '', apellidos: '', email: '', telefono: '', nif: '', direccion: '', empresa: false, notas: '' });
    setOpen(true);
  };

  const openEditar = (cliente: any) => {
    setSelectedCliente(cliente);
    reset({
      nombre: cliente.nombre,
      apellidos: cliente.apellidos ?? '',
      telefono: cliente.telefono ?? '',
      nif: cliente.nif ?? '',
      direccion: cliente.direccion ?? '',
      empresa: cliente.empresa ?? false,
      notas: cliente.notas ?? '',
    });
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setSelectedCliente(null);
    setConfirmDesactivar(false);
    reset();
  };

  const createMutation = useMutation({
    mutationFn: (data: Form) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      cerrarModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Form) => clientesApi.update(selectedCliente.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      cerrarModal();
    },
  });

  const desactivarMutation = useMutation({
    mutationFn: () => clientesApi.update(selectedCliente.id, { activo: !selectedCliente.activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      cerrarModal();
    },
  });

  const onSubmit = (data: Form) => {
    if (selectedCliente) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Directorio de clientes del despacho</p>
        </div>
        <button
          onClick={openCrear}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
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
              <th className="px-6 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((c: any) => (
              <tr
                key={c.id}
                onClick={() => openEditar(c)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 font-medium text-gray-900">{c.nombre} {c.apellidos}</td>
                <td className="px-6 py-4 text-gray-500">{c.email ?? '—'}</td>
                <td className="px-6 py-4 text-gray-500">{c.telefono ?? '—'}</td>
                <td className="px-6 py-4 text-gray-500">{c.nif ?? '—'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No hay clientes registrados.</div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCliente ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button onClick={cerrarModal}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    {...register('nombre')}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    {...register('apellidos')}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Email solo en creación */}
              {!selectedCliente && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              )}

              {/* Email en edición — solo lectura */}
              {selectedCliente?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    value={selectedCliente.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    {...register('telefono')}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIF / CIF</label>
                  <input
                    {...register('nif')}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  {...register('direccion')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('empresa')}
                  type="checkbox"
                  id="empresa"
                  className="rounded border-gray-300"
                />
                <label htmlFor="empresa" className="text-sm text-gray-700">Es una empresa</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  {...register('notas')}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  Error al guardar. Inténtalo de nuevo.
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {selectedCliente && (
                  <div>
                    {!confirmDesactivar ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDesactivar(true)}
                        className={`text-sm ${selectedCliente.activo ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {selectedCliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">¿Seguro?</span>
                        <button
                          type="button"
                          onClick={() => desactivarMutation.mutate()}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Sí, confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDesactivar(false)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
                  >
                    {isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}