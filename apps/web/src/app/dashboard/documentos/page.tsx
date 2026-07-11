'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { documentosApi, expedientesApi } from '@/lib/api';
import { FileText, Upload, Download, X, Eye, EyeOff } from 'lucide-react';

const TIPO_DOC_LABEL: Record<string, string> = {
  CONTRATO: 'Contrato',
  ESCRITO_JUDICIAL: 'Escrito judicial',
  DICTAMEN: 'Dictamen',
  PODER_NOTARIAL: 'Poder notarial',
  FACTURA_PDF: 'Factura',
  OTRO: 'Otro',
};

const TIPO_DOC_COLOR: Record<string, string> = {
  CONTRATO: 'bg-blue-50 text-blue-700',
  ESCRITO_JUDICIAL: 'bg-purple-50 text-purple-700',
  DICTAMEN: 'bg-amber-50 text-amber-700',
  PODER_NOTARIAL: 'bg-pink-50 text-pink-700',
  FACTURA_PDF: 'bg-green-50 text-green-700',
  OTRO: 'bg-gray-100 text-gray-500',
};

export default function DocumentosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [filtroExpediente, setFiltroExpediente] = useState('');
  const queryClient = useQueryClient();

  const { data: documentos, isLoading } = useQuery({
    queryKey: ['documentos'],
    queryFn: () => documentosApi.list().then((r) => r.data),
  });

  const { data: expedientes } = useQuery({
    queryKey: ['expedientes'],
    queryFn: () => expedientesApi.list().then((r) => r.data),
  });

  const form = useForm<{ expedienteId: string; titulo: string; tipo: string; visibleParaCliente: boolean }>();

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => documentosApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      setModalOpen(false);
      setArchivoSeleccionado(null);
      form.reset();
    },
  });

  const onSubmit = (data: { expedienteId: string; titulo: string; tipo: string, visibleParaCliente: boolean }) => {
    if (!archivoSeleccionado) return;
    const formData = new FormData();
    formData.append('file', archivoSeleccionado);
    formData.append('expedienteId', data.expedienteId);
    formData.append('titulo', data.titulo);
    formData.append('tipo', data.tipo);
    formData.append('visibleParaCliente', data.visibleParaCliente ? 'true' : 'false');
    uploadMutation.mutate(formData);
  };

  const documentosFiltrados = filtroExpediente
    ? documentos?.filter((d: any) => d.expedienteId === filtroExpediente)
    : documentos;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión documental del despacho</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Upload className="w-4 h-4" /> Subir documento
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={filtroExpediente}
          onChange={(e) => setFiltroExpediente(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Todos los expedientes</option>
          {expedientes?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.titulo}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
        {!isLoading && documentosFiltrados?.length === 0 && (
          <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-3">
            <FileText className="w-10 h-10" />
            <p className="text-sm">No hay documentos.</p>
          </div>
        )}
        {documentosFiltrados?.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Título</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Expediente</th>
                <th className="px-6 py-3 font-medium">Tamaño</th>
                <th className="px-6 py-3 font-medium">Subido</th>
                <th className="px-6 py-3 font-medium">Subido por</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentosFiltrados?.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.titulo}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TIPO_DOC_COLOR[d.tipo] ?? 'bg-gray-100 text-gray-500'}`}>
                      {TIPO_DOC_LABEL[d.tipo] ?? d.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{d.expediente?.titulo ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{(d.sizeBytes / 1024).toFixed(0)} KB</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(d.createdAt).toLocaleDateString('es-ES')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.creadoPor?.role === 'CLIENTE'
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-brand-50 text-brand-700'
                      }`}>
                      {d.creadoPor?.role === 'CLIENTE' ? 'Cliente' : 'Abogado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                    <button
                      onClick={async () => {
                        await documentosApi.update(d.id, { visibleParaCliente: !d.visibleParaCliente });
                        queryClient.invalidateQueries({ queryKey: ['documentos'] });
                      }}
                      className={`p-1 ${d.visibleParaCliente ? 'text-green-500' : 'text-gray-300'} hover:text-green-600`}
                      title={d.visibleParaCliente ? 'Visible para cliente' : 'Oculto para cliente'}
                    >
                      {d.visibleParaCliente ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={async () => {
                        const { data } = await documentosApi.getDownloadUrl(d.id);
                        window.open(data.url, '_blank');
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de subida */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Subir documento</h2>
              <button onClick={() => { setModalOpen(false); setArchivoSeleccionado(null); form.reset(); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expediente *</label>
                <select
                  {...form.register('expedienteId', { required: true })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Selecciona un expediente</option>
                  {expedientes?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.titulo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] ?? null)}
                  className="w-full text-sm border rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel o imagen. Máximo 20MB.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  {...form.register('titulo', { required: true })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select {...form.register('tipo')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="OTRO">Otro</option>
                  <option value="CONTRATO">Contrato</option>
                  <option value="ESCRITO_JUDICIAL">Escrito judicial</option>
                  <option value="DICTAMEN">Dictamen</option>
                  <option value="PODER_NOTARIAL">Poder notarial</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  defaultChecked
                  {...form.register('visibleParaCliente')}
                  className="rounded border-gray-300"
                />
                <label htmlFor="visible" className="text-sm text-gray-700">Visible para el cliente</label>
              </div>
              {uploadMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  Error al subir el documento. Comprueba el formato y el tamaño.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); setArchivoSeleccionado(null); form.reset(); }} className="px-4 py-2 text-sm text-gray-600">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!archivoSeleccionado || uploadMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
                >
                  {uploadMutation.isPending ? 'Subiendo...' : 'Subir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
