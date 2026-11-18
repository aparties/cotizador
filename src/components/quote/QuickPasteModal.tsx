'use client';

import { useState, useRef } from 'react';
import { parseQuickInput } from '@/utils/quote-parser';
import { RawItemInput } from '@/services/pricing-engine';
import { batchResolveDescriptions } from '@/services/quote-actions';
import { classifySunatTariff } from '@/utils/sunat-tariffs';
import { extractQuoteFromImage } from '@/services/gemini-ocr';
import { Clipboard, Loader2, Sparkles, X, Globe2, Wand2, DollarSign, Coins, Camera } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onItemsParsed: (newItems: RawItemInput[]) => void;
  defaultExchangeRate?: number;
  onOpenCodeGenerator?: () => void;
};

export function QuickPasteModal({
  isOpen,
  onClose,
  onItemsParsed,
  defaultExchangeRate = 3.765,
  onOpenCodeGenerator,
}: Props) {
  const [text, setText] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'PEN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(defaultExchangeRate);
  const [isResolving, setIsResolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsResolving(true);
    setStatusMessage('Analizando foto con IA Gemini Vision...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await extractQuoteFromImage(
            reader.result as string,
            file.type,
            currency,
            exchangeRate || 3.765
          );

          if (res.success && res.items.length > 0) {
            // Como formattedLine ya está calculado en USD con el T.C. seleccionado,
            // fijamos la moneda a USD para evitar una doble conversión accidental en parseQuickInput
            setCurrency('USD');
            const lines = res.items.map((it) => it.formattedLine).join('\n');
            setText((prev) => (prev.trim() ? `${prev.trim()}\n${lines}` : lines));
          } else {
            alert(res.error || 'No se pudieron extraer ítems de la foto.');
          }
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : 'Error al procesar imagen.');
        } finally {
          setIsResolving(false);
          setStatusMessage('');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsResolving(false);
      setStatusMessage('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          return;
        }
      }
    }
  };

  const handleProcess = async () => {
    const parsed = parseQuickInput(text, currency, exchangeRate);
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

        const tariff = classifySunatTariff(p.partNumber, finalDescription);

        return {
          id: p.id,
          partNumber: p.partNumber,
          description: finalDescription,
          quantity: p.quantity,
          baseUnitCostUsd: p.cost,
          baseUnitCostPen: currency === 'PEN' ? Number((p.cost * (exchangeRate || 3.765)).toFixed(2)) : undefined,
          currencyCost: currency,
          adValoremRate: tariff.adValoremRate,
          hsCode: tariff.hsCode,
          marginRatePct: 45,
        };
      });

      onItemsParsed(formatted);
      setText('');
      onClose();
    } catch (err) {
      console.error('Error resolving descriptions:', err);
      // Fallback in case of server action error
      const formatted: RawItemInput[] = parsed.map((p) => {
        const desc = p.description || `MÓDULO DE AUTOMATIZACIÓN ${p.partNumber}`;
        const tariff = classifySunatTariff(p.partNumber, desc);
        return {
          id: p.id,
          partNumber: p.partNumber,
          description: desc,
          quantity: p.quantity,
          baseUnitCostUsd: p.cost,
          baseUnitCostPen: currency === 'PEN' ? Number((p.cost * (exchangeRate || 3.765)).toFixed(2)) : undefined,
          currencyCost: currency,
          adValoremRate: tariff.adValoremRate,
          hsCode: tariff.hsCode,
          marginRatePct: 45,
        };
      });
      onItemsParsed(formatted);
      setText('');
      onClose();
    } finally {
      setIsResolving(false);
      setStatusMessage('');
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
    >
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

        {/* Barra de Moneda de Entrada y Asistente */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#081a14] px-4 py-2 border border-[#1d4034] text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Moneda del texto pegado:</span>
            <div className="flex rounded-xl bg-[#143028] p-0.5 border border-[#1d4034]">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  currency === 'USD'
                    ? 'bg-[#57cc99] text-[#0b241c] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" /> USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('PEN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  currency === 'PEN'
                    ? 'bg-[#57cc99] text-[#0b241c] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="h-3.5 w-3.5" /> Soles (PEN S/.)
              </button>
            </div>

            {currency === 'PEN' && (
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-slate-400">T.C.:</span>
                <input
                  type="number"
                  step="0.001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.765)}
                  className="w-16 rounded-lg border border-[#1d4034] bg-[#143028] px-2 py-0.5 font-bold text-white text-xs text-center focus:border-[#57cc99] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImageFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg bg-[#143028] border border-[#57cc99]/30 px-2 py-1 text-[11px] font-semibold text-[#80ed99] hover:bg-[#57cc99] hover:text-[#0b241c] transition-all"
              title="Sube o pega (Ctrl + V) una foto de la cotización"
            >
              <Camera className="h-3 w-3" /> Pegar Foto
            </button>

            {onOpenCodeGenerator && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCodeGenerator();
                }}
                className="flex items-center gap-1 font-semibold text-[#57cc99] hover:underline cursor-pointer text-xs"
              >
                <Wand2 className="h-3.5 w-3.5" /> Generador de Códigos
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={6}
          value={text}
          disabled={isResolving}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            currency === 'PEN'
              ? `Ejemplo en Soles (se convertirá a USD automáticamente):\nCAJAALU10X10 - CAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - S/ 22.95\nCONECTOR RECTO LIQUID TIGHT 1/2" - 4pcs - 4.59`
              : `Ejemplo en Dólares:\nCAJAALU10X10 - CAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - 6.0964\n6ES7545-5DA00-0AB0---1pcs --- $297.3/ea\n1756-L83E - ControlLogix 5580 Controller 10MB - 1 - 2100.00`
          }
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
