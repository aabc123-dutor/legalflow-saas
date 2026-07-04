'use client';

import { useQuery } from '@tanstack/react-query';
import { expedientesApi, documentosApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const ESTADO_COLOR: Record<string, string> = {
    ABIERTO: 'bg-green-50 text-green-700',
    CERRADO: 'bg-gray-100 text-gray-500',
    ARCHIVADO: 'bg-amber-50 text-amber-700',
};

const TIPO_DOC_LABEL: Record<string, string> = {
    CONTRATO: 'Contrato',
    ESCRITO_JUDICIAL: 'Escrito judicial',
    DICTAMEN: 'Dictamen',
    PODER_NOTARIAL: 'Poder notarial',
    FACTURA_PDF: 'Factura',
    OTRO: 'Otro',
};

export default function PortalExpedienteDetallePage() {
    const { id } = useParams<{ id: string }>();

    const { data: expediente, isLoading } = useQuery({
        queryKey: ['mis-expedientes', id],
        queryFn: () => expedientesApi.getMioById(id).then((r) => r.data),
    });

    if (isLoading) return <div className="text-center text-gray-400 text-sm p-8">Cargando...</div>;
    if (!expediente) return null;

    return (
        <div>
            <Link href="/portal/expedientes" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Volver a mis expedientes
            </Link>

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{expediente.titulo}</h1>
                    {expediente.descripcion && <p className="text-sm text-gray-500 mt-1">{expediente.descripcion}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                        Abierto el {new Date(expediente.fechaApertura).toLocaleDateString('es-ES')}
                    </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[expediente.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                    {expediente.estado}
                </span>
            </div>

            {/* Línea de tiempo de hitos */}
            <div className="bg-white rounded-xl border p-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Evolución del procedimiento</h2>
                {expediente.hitos?.length === 0 && (
                    <p className="text-sm text-gray-400">No hay eventos registrados aún.</p>
                )}
                <div className="space-y-4">
                    {expediente.hitos?.map((h: any, i: number) => (
                        <div key={h.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                                {i < expediente.hitos.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                            </div>
                            <div className="pb-4">
                                <p className="text-sm font-medium text-gray-900">{h.titulo}</p>
                                {h.descripcion && <p className="text-sm text-gray-500 mt-0.5">{h.descripcion}</p>}
                                <p className="text-xs text-gray-400 mt-1">{new Date(h.fecha).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Facturas */}
            <div className="bg-white rounded-xl border overflow-hidden mb-6">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-sm font-semibold text-gray-700">Facturas</h2>
                </div>
                {expediente.facturas?.length === 0 && (
                    <div className="p-6 text-sm text-gray-400">No hay facturas emitidas.</div>
                )}
                {expediente.facturas?.length > 0 && (
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr className="text-left text-gray-500">
                                <th className="px-6 py-3 font-medium">Número</th>
                                <th className="px-6 py-3 font-medium">Emisión</th>
                                <th className="px-6 py-3 font-medium">Vencimiento</th>
                                <th className="px-6 py-3 font-medium">Estado</th>
                                <th className="px-6 py-3 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {expediente.facturas.map((f: any) => {
                                const diasParaVencer = f.fechaVencimiento
                                    ? Math.ceil((new Date(f.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                    : null;
                                const cercaDeVencer = diasParaVencer !== null && diasParaVencer <= 3 && f.estado !== 'PAGADA' && f.estado !== 'ANULADA';

                                return (
                                    <tr key={f.id} className={`hover:bg-gray-50 ${cercaDeVencer ? 'bg-red-50' : ''}`}>
                                        <td className={`py-4 px-6 font-medium flex items-center gap-1.5 ${cercaDeVencer ? 'text-red-800' : 'text-gray-700'}`}>
                                            {cercaDeVencer && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                                            {f.numero}
                                        </td>
                                        <td className={`py-4 px-6  ${cercaDeVencer ? 'text-red-800' : 'text-gray-500'}`}>
                                            {new Date(f.fechaEmision).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className={`py-4 px-6  ${cercaDeVencer ? 'text-red-800 font-medium' : 'text-gray-500'}`}>
                                            {f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString('es-ES') : '—'}
                                        </td>
                                        <td className="py-4 px-6 ">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cercaDeVencer ? 'bg-red-200 text-red-900'
                                                : f.estado === 'PAGADA' ? 'bg-green-50 text-green-700' :
                                                    f.estado === 'EMITIDA' ? 'bg-blue-50 text-blue-700' :
                                                        f.estado === 'ANULADA' ? 'bg-gray-100 text-gray-400' :
                                                            'bg-gray-100 text-gray-500'
                                                }`}>
                                                {f.estado}
                                            </span>
                                        </td>
                                        <td className={`py-4 px-6  text-right font-medium ${cercaDeVencer ? 'text-red-800' : 'text-gray-900'}`}>
                                            {Number(f.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Documentos */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-sm font-semibold text-gray-700">Documentos</h2>
                </div>
                {expediente.documentos?.length === 0 && (
                    <div className="p-6 text-sm text-gray-400">No hay documentos disponibles.</div>
                )}
                {expediente.documentos?.length > 0 && (
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr className="text-left text-gray-500">
                                <th className="px-6 py-3 font-medium">Título</th>
                                <th className="px-6 py-3 font-medium">Tipo</th>
                                <th className="px-6 py-3 font-medium">Fecha</th>
                                <th className="px-6 py-3 font-medium">Subido por</th>
                                <th className="px-6 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {expediente.documentos.map((d: any) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{d.titulo}</td>
                                    <td className="px-6 py-4 text-gray-500">{TIPO_DOC_LABEL[d.tipo] ?? d.tipo}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(d.createdAt).toLocaleDateString('es-ES')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.creadoPor?.role === 'CLIENTE' ? 'bg-orange-50 text-orange-700' : 'bg-brand-50 text-brand-700'
                                            }`}>
                                            {d.creadoPor?.role === 'CLIENTE' ? 'Cliente' : 'Despacho'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={async () => {
                                                const { data } = await documentosApi.getDownloadUrl(d.id);
                                                window.open(data.url, '_blank');
                                            }}
                                            className="p-1 text-gray-400 hover:text-blue-500"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}