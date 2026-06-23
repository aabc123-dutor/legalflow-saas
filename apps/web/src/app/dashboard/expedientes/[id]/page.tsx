'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { expedientesApi } from '@/lib/api';
import { ArrowLeft, Plus, X, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { descargarICS, urlGoogleCalendar } from '@/lib/calendar';
import { Calendar } from 'lucide-react';

const ESTADO_COLOR: Record<string, string> = {
    ABIERTO: 'bg-green-100 text-green-700',
    EN_CURSO: 'bg-blue-100 text-blue-700',
    PENDIENTE_CLIENTE: 'bg-amber-100 text-amber-700',
    ARCHIVADO: 'bg-gray-100 text-gray-500',
    CERRADO: 'bg-red-100 text-red-700',
};

const ESTADOS = ['ABIERTO', 'EN_CURSO', 'PENDIENTE_CLIENTE', 'ARCHIVADO', 'CERRADO'];

export default function ExpedienteDetallePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [editando, setEditando] = useState(false);
    const [modalHito, setModalHito] = useState<any>(null); // null=cerrado, {}=nuevo, hito=editar
    const [modalNota, setModalNota] = useState<any>(null);

    const [menuHitoId, setMenuHitoId] = useState<string | null>(null);

    const { data: exp, isLoading } = useQuery({
        queryKey: ['expediente', id],
        queryFn: () => expedientesApi.get(id).then((r) => r.data),
    });

    // Formulario edición expediente
    const editForm = useForm({
        values: exp ? {
            titulo: exp.titulo,
            descripcion: exp.descripcion ?? '',
            estado: exp.estado,
            fechaCierre: exp.fechaCierre ? exp.fechaCierre.split('T')[0] : '',
        } : undefined,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => expedientesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expediente', id] });
            setEditando(false);
        },
    });

    // Hitos
    const hitoForm = useForm<{ titulo: string; descripcion?: string; fecha: string }>();

    const createHitoMutation = useMutation({
        mutationFn: (data: any) => expedientesApi.createHito(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expediente', id] });
            setModalHito(null);
            hitoForm.reset();
        },
    });

    const updateHitoMutation = useMutation({
        mutationFn: ({ hitoId, data }: any) => expedientesApi.updateHito(hitoId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expediente', id] });
            setModalHito(null);
            hitoForm.reset();
        },
    });

    const deleteHitoMutation = useMutation({
        mutationFn: (hitoId: string) => expedientesApi.deleteHito(hitoId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expediente', id] }),
    });

    const abrirModalHito = (hito?: any) => {
        if (hito) {
            hitoForm.reset({
                titulo: hito.titulo,
                descripcion: hito.descripcion ?? '',
                fecha: hito.fecha.split('T')[0],
            });
            setModalHito(hito);
        } else {
            hitoForm.reset({ titulo: '', descripcion: '', fecha: '' });
            setModalHito({});
        }
    };

    const onSubmitHito = (data: any) => {
        if (modalHito?.id) {
            updateHitoMutation.mutate({ hitoId: modalHito.id, data });
        } else {
            createHitoMutation.mutate(data);
        }
    };

    // Notas
    const notaForm = useForm<{ contenido: string }>();

    const createNotaMutation = useMutation({
        mutationFn: (data: any) => expedientesApi.createNota(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expediente', id] });
            setModalNota(null);
            notaForm.reset();
        },
    });

    const updateNotaMutation = useMutation({
        mutationFn: ({ notaId, data }: any) => expedientesApi.updateNota(notaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expediente', id] });
            setModalNota(null);
            notaForm.reset();
        },
    });

    const deleteNotaMutation = useMutation({
        mutationFn: (notaId: string) => expedientesApi.deleteNota(notaId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expediente', id] }),
    });

    const abrirModalNota = (nota?: any) => {
        if (nota) {
            notaForm.reset({ contenido: nota.contenido });
            setModalNota(nota);
        } else {
            notaForm.reset({ contenido: '' });
            setModalNota({});
        }
    };

    const onSubmitNota = (data: any) => {
        if (modalNota?.id) {
            updateNotaMutation.mutate({ notaId: modalNota.id, data });
        } else {
            createNotaMutation.mutate(data);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>;
    if (!exp) return <div className="p-8 text-center text-gray-400 text-sm">Expediente no encontrado.</div>;

    const hoy = new Date();

    return (
        <div>
            {/* Cabecera */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <Link href="/dashboard/expedientes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
                        <ArrowLeft className="w-4 h-4" /> Expedientes
                    </Link>
                    {editando ? (
                        <input
                            {...editForm.register('titulo')}
                            className="text-2xl font-bold text-gray-900 border-b border-brand-400 focus:outline-none bg-transparent w-full"
                        />
                    ) : (
                        <h1 className="text-2xl font-bold text-gray-900">{exp.titulo}</h1>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[exp.estado]}`}>
                            {exp.estado.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                            {exp.cliente?.nombre} {exp.cliente?.apellidos ?? ''}
                        </span>
                        <span className="text-xs text-gray-400">
                            Abierto el {new Date(exp.fechaApertura).toLocaleDateString('es-ES')}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {editando ? (
                        <>
                            <button
                                onClick={() => setEditando(false)}
                                className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                            >
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
                    ) : (
                        <button
                            onClick={() => setEditando(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                        >
                            <Pencil className="w-4 h-4" /> Editar
                        </button>
                    )}
                </div>
            </div>

            {/* Datos + Descripción */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl border p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Datos del expediente</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-gray-50">
                            <span className="text-gray-500">Cliente</span>
                            <span className="font-medium text-blue-600">{exp.cliente?.nombre} {exp.cliente?.apellidos ?? ''}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50 items-center">
                            <span className="text-gray-500">Estado</span>
                            {editando ? (
                                <select {...editForm.register('estado')} className="text-sm border rounded px-2 py-1 bg-white">
                                    {ESTADOS.map((e) => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
                                </select>
                            ) : (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[exp.estado]}`}>
                                    {exp.estado.replace(/_/g, ' ')}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50">
                            <span className="text-gray-500">Apertura</span>
                            <span className="font-medium">{new Date(exp.fechaApertura).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between py-1 items-center">
                            <span className="text-gray-500">Cierre</span>
                            {editando ? (
                                <input type="date" {...editForm.register('fechaCierre')} className="text-sm border rounded px-2 py-1" />
                            ) : (
                                <span className="font-medium text-gray-400">{exp.fechaCierre ? new Date(exp.fechaCierre).toLocaleDateString('es-ES') : '—'}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Descripción</p>
                    {editando ? (
                        <textarea
                            {...editForm.register('descripcion')}
                            rows={5}
                            className="w-full text-sm text-gray-600 focus:outline-none resize-none border rounded-lg p-2"
                        />
                    ) : (
                        <p className="text-sm text-gray-600 leading-relaxed">{exp.descripcion || <span className="text-gray-400">Sin descripción</span>}</p>
                    )}
                </div>
            </div>

            {/* Hitos */}
            <div className="bg-white rounded-xl border p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Hitos y fechas clave</p>
                    <button onClick={() => abrirModalHito()} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 border border-brand-200 rounded-lg px-3 py-1.5">
                        <Plus className="w-3.5 h-3.5" /> Añadir
                    </button>
                </div>
                {exp.hitos.length === 0 && <p className="text-sm text-gray-400">No hay hitos registrados.</p>}
                <div className="space-y-0 divide-y">
                    {exp.hitos.map((h: any) => {
                        const esPasado = new Date(h.fecha) < hoy;
                        return (
                            <div key={h.id} className="flex items-start gap-3 py-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${esPasado ? 'bg-gray-300' : 'bg-blue-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${esPasado ? 'text-gray-400' : 'text-gray-900'}`}>{h.titulo}</p>
                                    {h.descripcion && <p className="text-xs text-gray-400 mt-0.5">{h.descripcion}</p>}
                                </div>
                                <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full font-medium ${esPasado ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-700'}`}>
                                    {new Date(h.fecha).toLocaleDateString('es-ES')}
                                </span>
                                <div className="relative shrink-0">
                                    <button
                                        onClick={() => setMenuHitoId(menuHitoId === h.id ? null : h.id)}
                                        className="p-1 text-gray-400 hover:text-blue-500"
                                        title="Añadir al calendario"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                    {menuHitoId === h.id && (
                                        <div className="absolute right-0 top-6 z-10 bg-white border rounded-lg shadow-lg py-1 w-44">
                                            <a
                                                href={urlGoogleCalendar(h)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setMenuHitoId(null)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Google Calendar
                                            </a>
                                            <button
                                                onClick={() => { descargarICS(h); setMenuHitoId(null); }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Apple Calendar / Outlook
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => abrirModalHito(h)} className="p-1 text-gray-400 hover:text-gray-600">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => deleteHitoMutation.mutate(h.id)} className="p-1 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Notas */}
            <div className="bg-white rounded-xl border p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notas internas</p>
                    <button onClick={() => abrirModalNota()} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 border border-brand-200 rounded-lg px-3 py-1.5">
                        <Plus className="w-3.5 h-3.5" /> Añadir
                    </button>
                </div>
                {exp.notas.length === 0 && <p className="text-sm text-gray-400">No hay notas registradas.</p>}
                <div className="space-y-3">
                    {exp.notas.map((n: any) => (
                        <div key={n.id} className="bg-gray-50 rounded-lg p-4 relative group">
                            <p className="text-sm text-gray-800 leading-relaxed">{n.contenido}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString('es-ES')}</p>
                            <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
                                <button onClick={() => abrirModalNota(n)} className="p-1 text-gray-400 hover:text-gray-600">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteNotaMutation.mutate(n.id)} className="p-1 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Documentos + Facturas */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Documentos</p>
                    {exp.documentos.length === 0
                        ? <p className="text-sm text-gray-400">Sin documentos.</p>
                        : exp.documentos.map((d: any) => (
                            <div key={d.id} className="flex items-center gap-2 py-2 border-b last:border-0 text-sm">
                                <span className="flex-1 truncate text-gray-700">{d.titulo}</span>
                                <span className="text-xs text-gray-400">{(d.sizeBytes / 1024).toFixed(0)} KB</span>
                            </div>
                        ))
                    }
                </div>

                <div className="bg-white rounded-xl border p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Facturas</p>
                    {exp.facturas.length === 0
                        ? <p className="text-sm text-gray-400">Sin facturas.</p>
                        : exp.facturas.map((f: any) => (
                            <div key={f.id} className="flex items-center gap-3 py-2 border-b last:border-0 text-sm">
                                <span className="flex-1 text-gray-700">{f.numero}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.estado === 'PAGADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {f.estado}
                                </span>
                                <span className="font-medium text-gray-900">{Number(f.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Modal Hito */}
            {modalHito !== null && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900">{modalHito?.id ? 'Editar hito' : 'Nuevo hito'}</h2>
                            <button onClick={() => setModalHito(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={hitoForm.handleSubmit(onSubmitHito)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                                <input {...hitoForm.register('titulo', { required: true })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input {...hitoForm.register('descripcion')} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                                <input type="date" {...hitoForm.register('fecha', { required: true })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setModalHito(null)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                                <button type="submit" disabled={createHitoMutation.isPending || updateHitoMutation.isPending} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Nota */}
            {modalNota !== null && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900">{modalNota?.id ? 'Editar nota' : 'Nueva nota'}</h2>
                            <button onClick={() => setModalNota(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={notaForm.handleSubmit(onSubmitNota)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nota *</label>
                                <textarea {...notaForm.register('contenido', { required: true })} rows={5} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setModalNota(null)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                                <button type="submit" disabled={createNotaMutation.isPending || updateNotaMutation.isPending} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}