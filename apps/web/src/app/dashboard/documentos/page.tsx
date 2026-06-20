'use client';
import { FileText, Upload } from 'lucide-react';

export default function DocumentosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión documental del despacho</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Upload className="w-4 h-4" /> Subir documento
        </button>
      </div>
      <div className="bg-white rounded-xl border p-8 flex flex-col items-center justify-center text-gray-400 gap-3">
        <FileText className="w-10 h-10" />
        <p className="text-sm">Sube documentos desde un expediente o directamente aquí.</p>
        <p className="text-xs">Formatos admitidos: PDF, DOCX, XLSX, JPG, PNG</p>
      </div>
    </div>
  );
}
