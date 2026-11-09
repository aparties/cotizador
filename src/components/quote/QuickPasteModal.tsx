'use client';

import { useState } from 'react';
import { parseQuickInput } from '@/utils/quote-parser';
import { RawItemInput } from '@/services/pricing-engine';
import { batchResolveDescriptions } from '@/services/quote-actions';
import { Clipboard, Loader2, Sparkles, X, Globe2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onItemsParsed: (newItems: RawItemInput[]) => void;
};

export function QuickPasteModal({ isOpen, onClose, onItemsParsed }: Props) {
  const [text, setText] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleProcess = async () => {
    const parsed = parseQuickInput(text);
    if (parsed.length === 0) {
      onClose();
      return;
    }

    setIsResolving(true);
    setStatusMessage('Consultando descripciones técnicas de módulos...');

    try {
      // Send to server action to resolve exact technical descriptions
      const res = await batchResolveDescriptions(
        parsed.map((p) => ({
          partNumber: p.partNumber,
          hasUserDescription: p.hasUserDescription,
          description: p.description,
        }))
      );

      const resolvedMap = new Map<string, string>();
      if (res.success && res.items) {
        for (const item of res.items) {
          resolvedMap.set(item.partNumber, item.description);
        }
      }

      const formatted: RawItemInput[] = parsed.map((p) => {
        let finalDescription = p.hasUserDescription ? p.description : resolvedMap.get(p.partNumber);
        if (!finalDescription || !finalDescription.trim()) {
          finalDescription = `REPUESTO INDUSTRIAL MOD. ${p.partNumber}`;
        }

        return {
          id: p.id,
          partNumber: p.partNumber,
          description: finalDescription,
          quantity: p.quantity,
          baseUnitCostUsd: p.cost,
          adValoremRate: 0,
          marginRatePct: 45,
        };
      });

      onItemsParsed(formatted);
      setText('');
      onClose();
    } catch (err) {
      console.error('Error resolving descriptions:', err);
      // Fallback in case of server action error
      const formatted: RawItemInput[] = parsed.map((p) => ({
        id: p.id,
        partNumber: p.partNumber,
        description: p.description || `MÓDULO DE AUTOMATIZACIÓN ${p.partNumber}`,
        quantity: p.quantity,
        baseUnitCostUsd: p.cost,
        adValoremRate: 0,
        marginRatePct: 45,
      }));
      onItemsParsed(formatted);
      setText('');
      onClose();
    } finally {
      setIsResolving(false);
      setStatusMessage('');
    }
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
          <button
            type="button"
            onClick={onClose}
            disabled={isResolving}
            className="text-[#a8b5b0] hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <textarea
          rows={6}
          value={text}
          disabled={isResolving}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ejemplo:\n6ES7545-5DA00-0AB0---1pcs --- $297.3/ea\n6ES7137-6BD00-0BA0---1PCS\n1756-L83E - ControlLogix 5580 Controller 10MB - 1 - 2100.00`}
          className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] p-4 font-mono text-sm text-white placeholder-emerald-100/20 focus:border-[#57cc99] focus:outline-none disabled:opacity-50"
        />

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[#57cc99]">
            {isResolving ? (
              <span className="flex items-center gap-1.5 font-medium text-[#80ed99]">
                <Loader2 className="h-4 w-4 animate-spin text-[#57cc99]" />
                {statusMessage}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-[#57cc99]" />
                Detecta código puro, cantidad, costo y busca la descripción técnica exacta
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isResolving}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#a8b5b0] hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={isResolving || !text.trim()}
              className="flex items-center gap-2 rounded-full bg-[#57cc99] px-6 py-2.5 text-sm font-bold text-[#0b241c] transition-all hover:bg-[#80ed99] disabled:opacity-50"
            >
              {isResolving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" /> Importar al Cotizador
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
