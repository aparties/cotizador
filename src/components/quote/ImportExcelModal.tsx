'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { importProductsFromExcelBase64, ImportResult } from '@/services/import-actions';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls')) {
        setFile(selected);
        setErrorMsg(null);
        setResult(null);
      } else {
        setErrorMsg('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await importProductsFromExcelBase64(base64);
          if (res.success) {
            setResult(res);
            if (onSuccess) onSuccess();
          } else {
            setErrorMsg(res.error || 'Error al procesar el archivo Excel.');
          }
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : 'Error inesperado al subir el archivo.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al leer el archivo.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#1d4034] bg-[#0e2a21] p-6 shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#1d4034] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#57cc99]/20 text-[#57cc99]">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importar / Actualizar Catálogo Excel</h2>
              <p className="text-xs text-[#a8b5b0]">Sincroniza inventario desde Keyfacil o Excel a Neon PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#143028] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drag & Drop or Select Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-[#224d3e] bg-[#143028]/50 p-6 text-center hover:border-[#57cc99] hover:bg-[#143028] transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="mx-auto h-9 w-9 text-[#57cc99] mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-white">
            {file ? file.name : 'Haz clic para seleccionar o arrastra tu archivo Excel'}
          </p>
          <p className="text-xs text-[#a8b5b0] mt-1">
            Compatible con formatos exportados de Keyfacil (<code>reporte-keyfacil.xlsx</code>)
          </p>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-500/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="rounded-xl bg-[#143028] border border-[#57cc99]/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#80ed99]">
              <CheckCircle2 className="h-5 w-5" />
              <span>¡Sincronización Completada con Éxito!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="bg-[#0b241c] p-2 rounded-lg border border-[#1d4034]">
                <p className="text-slate-400 text-[10px]">TOTAL FILAS</p>
                <p className="text-base font-bold text-white">{result.total}</p>
              </div>
              <div className="bg-[#0b241c] p-2 rounded-lg border border-[#1d4034]">
                <p className="text-slate-400 text-[10px]">NUEVOS</p>
                <p className="text-base font-bold text-[#57cc99]">+{result.imported}</p>
              </div>
              <div className="bg-[#0b241c] p-2 rounded-lg border border-[#1d4034]">
                <p className="text-slate-400 text-[10px]">ACTUALIZADOS</p>
                <p className="text-base font-bold text-[#80ed99]">{result.updated}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#143028] transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="flex items-center gap-2 rounded-xl bg-[#57cc99] px-5 py-2 text-xs font-bold text-[#0b241c] hover:bg-[#80ed99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando en Neon...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" /> Sincronizar en Neon DB
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
