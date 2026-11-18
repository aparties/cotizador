'use client';

import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Copy,
  Check,
  ArrowRight,
  X,
  Sparkles,
  DollarSign,
  Coins,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { processRawQuoteToQuickPaste, GeneratedCodeItem } from '@/utils/code-generator';
import { RawItemInput } from '@/services/pricing-engine';
import { classifySunatTariff } from '@/utils/sunat-tariffs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultExchangeRate?: number;
  onImportToQuote?: (items: RawItemInput[]) => void;
}

const SAMPLE_TEXT = `CAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - S/ 22.9529
FINAL DE CARRERA CON ROLDANA PALANCA LARGA TELEMECANIQUE XCKJ10541H29C - 1pcs - S/ 177.8978
CONECTOR RECTO LIQUID TIGHT 1/2" - 4pcs - S/ 4.5884
CONECTOR CURVO LIQUID TIGHT 1/2" - 2pcs - S/ 4.5884
CABLE GPT #18AWG (100MTS) - 1pcs - S/ 86.0804`;

export const CodeGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultExchangeRate = 3.765,
  onImportToQuote,
}) => {
  const [inputText, setInputText] = useState('');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [exchangeRate, setExchangeRate] = useState<number>(defaultExchangeRate);
  const [copied, setCopied] = useState(false);

  // Proceso reactivo en tiempo real
  const generatedItems: GeneratedCodeItem[] = useMemo(() => {
    return processRawQuoteToQuickPaste(inputText, currency, exchangeRate || 3.765);
  }, [inputText, currency, exchangeRate]);

  const outputFormattedText = useMemo(() => {
    return generatedItems.map((it) => it.formattedLine).join('\n');
  }, [generatedItems]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!outputFormattedText) return;
    navigator.clipboard.writeText(outputFormattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectImport = () => {
    if (!onImportToQuote || generatedItems.length === 0) return;

    const formatted: RawItemInput[] = generatedItems.map((g) => {
      const tariff = classifySunatTariff(g.code, g.description);
      return {
        id: crypto.randomUUID(),
        partNumber: g.code,
        description: g.description,
        quantity: g.quantity,
        baseUnitCostUsd: g.convertedPriceUsd,
        adValoremRate: tariff.adValoremRate,
        hsCode: tariff.hsCode,
        marginRatePct: 45,
      };
    });

    onImportToQuote(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#1d4034] bg-[#0e2a21] shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1d4034] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#57cc99]/20 text-[#57cc99]">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Generador de Códigos & Conversor Soles ➔ Dólares
                <span className="rounded-full bg-[#57cc99]/20 px-2 py-0.5 text-[10px] font-mono text-[#57cc99]">
                  Quick Paste Helper
                </span>
              </h2>
              <p className="text-xs text-[#a8b5b0]">
                Crea códigos SKU automáticos a partir de descripciones y convierte cotizaciones en Soles a USD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#143028] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Configuración de Moneda y T.C. */}
        <div className="bg-[#143028]/70 border-b border-[#1d4034] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Moneda de origen:</span>
              <div className="flex rounded-xl bg-[#081a14] p-1 border border-[#1d4034]">
                <button
                  type="button"
                  onClick={() => setCurrency('PEN')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all ${
                    currency === 'PEN'
                      ? 'bg-[#57cc99] text-[#0b241c] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="h-3.5 w-3.5" /> Soles (PEN S/.)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all ${
                    currency === 'USD'
                      ? 'bg-[#57cc99] text-[#0b241c] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" /> Dólares (USD $)
                </button>
              </div>
            </div>

            {currency === 'PEN' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Tipo de Cambio (T.C.):</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-[10px] text-[#57cc99] font-mono">S/</span>
                  <input
                    type="number"
                    step="0.001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.765)}
                    className="w-24 rounded-xl border border-[#1d4034] bg-[#081a14] pl-7 pr-2 py-1 font-mono font-bold text-white text-xs focus:border-[#57cc99] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setInputText(SAMPLE_TEXT);
              setCurrency('PEN');
            }}
            className="flex items-center gap-1 text-[11px] text-[#57cc99] hover:underline cursor-pointer"
          >
            <Sparkles className="h-3 w-3" /> Cargar ejemplo (Caja, Líquid Tight, Cables)
          </button>
        </div>

        {/* Contenido en 2 Columnas */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Panel Izquierdo: Entrada Cruda */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>1. Pega aquí el texto crudo o Excel del proveedor</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Líneas: {inputText.split('\n').filter(Boolean).length}
              </span>
            </div>

            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Pega texto de WhatsApp, PDF o columnas de Excel:\n\nCAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - S/ 22.95\nFINAL DE CARRERA TELEMECANIQUE XCKJ10541H29C - 1pcs - S/ 177.89\nCONECTOR RECTO LIQUID TIGHT 1/2" - 4pcs - S/ 4.59\nCABLE GPT #18AWG - 1pcs - S/ 86.08`}
              className="flex-1 w-full rounded-2xl border border-[#1d4034] bg-[#081a14] p-3.5 font-mono text-xs text-white placeholder-slate-600 focus:border-[#57cc99] focus:outline-none resize-none leading-relaxed"
            />
            
            <p className="text-[10px] text-[#a8b5b0] leading-tight">
              💡 <strong>Tip:</strong> Puedes pegar filas copiadas directamente de Excel con columnas separadas por tabuladores, o listas con guiones y precios en Soles o Dólares.
            </p>
          </div>

          {/* Panel Derecho: Salida Formateada para Quick Paste */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#80ed99] flex items-center gap-1.5">
                <span>2. Formato Generado para Quick Paste</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({generatedItems.length} ítems)
                </span>
              </label>
              
              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputFormattedText}
                className="flex items-center gap-1 rounded-lg bg-[#143028] border border-[#1d4034] px-2.5 py-1 text-[11px] font-semibold text-[#57cc99] hover:bg-[#57cc99] hover:text-[#0b241c] transition-all disabled:opacity-40"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar Formato
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              rows={12}
              value={outputFormattedText}
              placeholder="Aquí aparecerá el formato listo para Quick Paste:&#10;CODIGO - DESCRIPCION - CANTIDADpcs - PRECIO_USD"
              className="flex-1 w-full rounded-2xl border border-[#57cc99]/30 bg-[#081a14] p-3.5 font-mono text-xs text-[#80ed99] placeholder-slate-600 focus:border-[#57cc99] focus:outline-none resize-none leading-relaxed select-all"
            />

            {generatedItems.length > 0 && (
              <div className="rounded-xl bg-[#143028]/80 border border-[#1d4034] p-2.5 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>RESUMEN CONVERSIÓN:</span>
                  <span>{currency === 'PEN' ? `T.C. S/ ${exchangeRate}` : 'Precios en USD'}</span>
                </div>
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-white">{generatedItems.length} Partidas generadas</span>
                  {currency === 'PEN' && (
                    <span className="text-[#57cc99]">
                      Total: S/ {generatedItems.reduce((acc, it) => acc + (it.originalPrice * it.quantity), 0).toFixed(2)} ➔ US$ {generatedItems.reduce((acc, it) => acc + (it.convertedPriceUsd * it.quantity), 0).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="border-t border-[#1d4034] bg-[#0b241c]/60 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-[#143028] hover:text-white transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!outputFormattedText}
              className="flex items-center gap-2 rounded-xl border border-[#1d4034] bg-[#143028] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#57cc99] hover:text-white transition-all disabled:opacity-40"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-[#57cc99]" />}
              Copiar para Quick Paste
            </button>

            {onImportToQuote && (
              <button
                type="button"
                onClick={handleDirectImport}
                disabled={generatedItems.length === 0}
                className="flex items-center gap-2 rounded-xl bg-[#57cc99] px-5 py-2 text-xs font-bold text-[#0b241c] hover:bg-[#80ed99] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4" /> Enviar Directo a Cotización
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
