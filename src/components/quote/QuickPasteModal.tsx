'use client';

import { useState } from 'react';
import { parseQuickInput } from '@/utils/quote-parser';
import { RawItemInput } from '@/services/pricing-engine';
import { Clipboard, Sparkles, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onItemsParsed: (newItems: RawItemInput[]) => void;
};

export function QuickPasteModal({ isOpen, onClose, onItemsParsed }: Props) {
  const [text, setText] = useState('');
  if (!isOpen) return null;

  const handleProcess = () => {
    const parsed = parseQuickInput(text);
    const formatted: RawItemInput[] = parsed.map((p) => ({
      id: p.id,
      partNumber: p.partNumber,
      description: p.description || `Repuesto industrial ${p.partNumber}`,
      quantity: p.quantity,
      baseUnitCostUsd: p.cost,
      adValoremRate: 0,
      marginRatePct: 45,
    }));
    onItemsParsed(formatted);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-[40px] border border-[#1d4034] bg-[#143028] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#57cc99]/20 text-[#57cc99]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Quick Input / Pegado Masivo</h3>
              <p className="text-xs text-[#a8b5b0]">Pega líneas crudas de WhatsApp, PDF o correos de proveedores</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#a8b5b0] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ejemplo:\n6ES7545-5DA00-0AB0---1pcs --- $297.3/ea\n1756-L83E x 2 @ 2100.00\nATV320U15N4B \t 1 \t 450.50`}
          className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] p-4 font-mono text-sm text-white placeholder-emerald-100/20 focus:border-[#57cc99] focus:outline-none"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-[#57cc99]">Detecta automáticamente Código, Cantidad y Costo FOB</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#a8b5b0] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProcess}
              className="flex items-center gap-2 rounded-full bg-[#57cc99] px-6 py-2.5 text-sm font-bold text-[#0b241c] transition-all hover:bg-[#80ed99]"
            >
              <Clipboard className="h-4 w-4" /> Importar al Cotizador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

