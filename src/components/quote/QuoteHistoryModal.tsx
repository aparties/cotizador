'use client';

import { useState, useEffect } from 'react';
import { getRecentQuotes } from '@/services/quote-actions';
import { History, FileText, Calendar, DollarSign, X, RefreshCw } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuoteToView: (quote: any) => void;
};

export function QuoteHistoryModal({ isOpen, onClose, onSelectQuoteToView }: Props) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuotes = async () => {
    setIsLoading(true);
    const res = await getRecentQuotes();
    if (res.success) {
      setQuotes(res.quotes);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuotes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-[40px] border border-[#1d4034] bg-[#143028] p-6 shadow-2xl text-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1d4034]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#57cc99]/20 border border-[#57cc99]/40 flex items-center justify-center text-[#57cc99]">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Historial de Proformas Guardadas</h3>
              <p className="text-xs text-[#a8b5b0]">Cotizaciones registradas en Neon PostgreSQL</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchQuotes}
              disabled={isLoading}
              className="rounded-full bg-[#081a14] p-2 text-[#57cc99] hover:bg-[#1d4034] transition-colors"
              title="Recargar lista"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onClose} className="rounded-full bg-[#081a14] p-2 text-[#a8b5b0] hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#a8b5b0]">Cargando cotizaciones desde Neon...</div>
          ) : quotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#a8b5b0]">
              <FileText className="mx-auto h-8 w-8 text-[#57cc99]/40 mb-2" />
              Aún no hay cotizaciones guardadas en la base de datos.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1d4034] text-[10px] font-semibold uppercase text-[#57cc99]">
                  <th className="pb-2.5 pl-2">Código</th>
                  <th className="pb-2.5">Cliente / RUC</th>
                  <th className="pb-2.5">Fecha</th>
                  <th className="pb-2.5 text-center">Ítems</th>
                  <th className="pb-2.5 text-right">Total Facturado</th>
                  <th className="pb-2.5 text-center pr-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d4034]/60">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#081a14]/50 transition-colors">
                    <td className="py-3 pl-2 font-mono font-bold text-white">
                      {q.code}
                    </td>
                    <td className="py-3">
                      <p className="font-semibold text-slate-200 truncate max-w-xs">{q.clientBusinessName}</p>
                      <p className="font-mono text-[10px] text-[#57cc99]">RUC: {q.clientRuc}</p>
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="py-3 text-center font-mono">
                      {q.items?.length || 0}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-[#80ed99]">
                      ${Number(q.totalAmountUsd).toFixed(2)}
                    </td>
                    <td className="py-3 text-center pr-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectQuoteToView(q);
                          onClose();
                        }}
                        className="rounded-full bg-[#57cc99] px-3 py-1 text-[11px] font-bold text-[#0b241c] hover:bg-[#80ed99] transition-all"
                      >
                        Ver Proforma
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-[#1d4034] text-xs text-[#a8b5b0]">
          <span>Total en base de datos: {quotes.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#081a14] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1d4034]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
