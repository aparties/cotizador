'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Wand2,
  Copy,
  Check,
  ArrowRight,
  X,
  Sparkles,
  DollarSign,
  Coins,
  Camera,
  ImageIcon,
  Loader2,
  UploadCloud,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { processRawQuoteToQuickPaste, GeneratedCodeItem } from '@/utils/code-generator';
import { RawItemInput } from '@/services/pricing-engine';
import { classifySunatTariff } from '@/utils/sunat-tariffs';
import { extractQuoteFromImage } from '@/services/gemini-ocr';

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

  // Estados de Imagen y Gemini Vision
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Función para procesar imagen con Gemini Vision
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('El archivo debe ser una imagen válida (PNG, JPG, WEBP).');
      return;
    }

    setImageName(file.name);
    setImageError(null);
    setIsAnalyzingImage(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          setImagePreview(dataUrl);

          const res = await extractQuoteFromImage(dataUrl, file.type, currency, exchangeRate || 3.765);

          if (res.success && res.items.length > 0) {
            // Actualizar el texto de entrada con el texto formateado
            const newText = res.items.map((it) => it.formattedLine).join('\n');
            setInputText(newText);
          } else {
            setImageError(res.error || 'No se pudieron detectar ítems en la imagen. Intenta con una foto más nítida.');
          }
        } catch (err: unknown) {
          setImageError(err instanceof Error ? err.message : 'Error al procesar la imagen con Gemini.');
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Error al leer el archivo de imagen.');
      setIsAnalyzingImage(false);
    }
  };

  // Manejo de pegado directo desde portapapeles (Ctrl + V de foto)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageName('');
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onPaste={handlePaste}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
    >
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
                  IA Gemini Vision + OCR
                </span>
              </h2>
              <p className="text-xs text-[#a8b5b0]">
                Pega texto o <strong>sube/pega una foto (Ctrl+V)</strong> de la cotización para extraer ítems automáticamente
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

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl bg-[#081a14] border border-[#57cc99]/40 px-3 py-1 text-xs font-semibold text-[#80ed99] hover:bg-[#57cc99] hover:text-[#0b241c] transition-all shadow-sm"
              title="Selecciona o toma una foto de la proforma o cotización"
            >
              <Camera className="h-3.5 w-3.5" /> Pegar o Subir Foto
            </button>

            <button
              type="button"
              onClick={() => {
                setInputText(SAMPLE_TEXT);
                setCurrency('PEN');
              }}
              className="flex items-center gap-1 text-[11px] text-[#57cc99] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3" /> Cargar ejemplo
            </button>
          </div>
        </div>

        {/* Alerta de análisis de imagen o error */}
        {isAnalyzingImage && (
          <div className="bg-[#143028] border-b border-[#57cc99]/40 px-6 py-2.5 flex items-center gap-3 text-xs text-[#80ed99]">
            <Loader2 className="h-4 w-4 animate-spin text-[#57cc99]" />
            <span>
              <strong>Gemini Vision está analizando la imagen ({imageName})...</strong> Leyendo ítems, cantidades y precios...
            </span>
          </div>
        )}

        {imageError && (
          <div className="bg-red-950/60 border-b border-red-500/30 px-6 py-2 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{imageError}</span>
            </div>
            <button onClick={() => setImageError(null)} className="text-red-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Vista previa de imagen si fue cargada */}
        {imagePreview && (
          <div className="bg-[#081a14] border-b border-[#1d4034] px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <img
                src={imagePreview}
                alt="Foto de Cotización"
                className="h-10 w-14 object-cover rounded-lg border border-[#1d4034]"
              />
              <div>
                <p className="font-semibold text-white truncate max-w-xs">{imageName || 'Imagen pegada desde portapapeles'}</p>
                <p className="text-[10px] text-[#57cc99]">Extraída con éxito mediante Gemini Vision</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-xs transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Quitar imagen
            </button>
          </div>
        )}

        {/* Contenido en 2 Columnas */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Panel Izquierdo: Entrada Cruda */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>1. Texto crudo o pega una captura (Ctrl + V)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Líneas: {inputText.split('\n').filter(Boolean).length}
              </span>
            </div>

            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Puedes pegar texto normal, columnas de Excel o presionar Ctrl + V para PEGAR UNA FOTO de la cotización:\n\nCAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - S/ 22.95\nFINAL DE CARRERA TELEMECANIQUE XCKJ10541H29C - 1pcs - S/ 177.89\nCONECTOR RECTO LIQUID TIGHT 1/2" - 4pcs - S/ 4.59\nCABLE GPT #18AWG - 1pcs - S/ 86.08`}
              className="flex-1 w-full rounded-2xl border border-[#1d4034] bg-[#081a14] p-3.5 font-mono text-xs text-white placeholder-slate-600 focus:border-[#57cc99] focus:outline-none resize-none leading-relaxed"
            />
            
            <div className="flex items-center justify-between text-[10px] text-[#a8b5b0]">
              <span>💡 Presiona <strong>Ctrl + V</strong> en cualquier momento con una captura de pantalla</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#57cc99] hover:underline cursor-pointer"
              >
                o sube un archivo
              </button>
            </div>
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
