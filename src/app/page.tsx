'use client';

import { useState, useMemo } from 'react';
import {
  calculateQuote,
  RawItemInput,
  QuoteGlobalParams,
  CalculationOrigin,
  ProrationType,
  MarginType,
} from '@/services/pricing-engine';
import { QuickPasteModal } from '@/components/quote/QuickPasteModal';
import { QuoteHeaderConfig } from '@/components/quote/QuoteHeaderConfig';
import { QuoteItemsTable } from '@/components/quote/QuoteItemsTable';
import { KpiSummaryBar } from '@/components/quote/KpiSummaryBar';
import { BicodeProformaView } from '@/components/quote/BicodeProformaView';
import { SelectedCustomer } from '@/components/quote/CustomerSelector';
import { Sparkles, Layers } from 'lucide-react';

export default function Home() {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Parámetros de Cotización
  const [origin, setOrigin] = useState<CalculationOrigin>('IMPORTACION');
  const [prorationMethod, setProrationMethod] = useState<ProrationType>('BY_VALUE');
  const [marginStrategy, setMarginStrategy] = useState<MarginType>('MARKUP');
  const [totalFreightUsd, setTotalFreightUsd] = useState(120.0);
  const [totalHandlingUsd, setTotalHandlingUsd] = useState(50.0);
  const [exchangeRatePen, setExchangeRatePen] = useState(3.765);

  // Cliente Seleccionado (por defecto Heineken del reporte)
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer>({
    ruc: '20605524126',
    businessName: 'HEINEKEN PERU S.A.C.',
    address: 'AV. CIRCUNVALACIÓN GOLF LOS I NRO. 154 INT. 1702 - LIMA LIMA SANTIAGO DE SURCO',
    paymentTerm: '60 DÍAS',
    paymentCondition: 'CRÉDITO',
  });

  // Ítems iniciales con repuestos del catálogo
  const [rawItems, setRawItems] = useState<RawItemInput[]>([
    {
      id: 'item-1',
      partNumber: '6ES7131-6BF01-0AA0',
      description: 'REPUESTOS SIEMENS 6ES7131-6BF01-0AA0',
      quantity: 10,
      baseUnitCostUsd: 52.0,
      adValoremRate: 0,
      marginRatePct: 45,
    },
    {
      id: 'item-2',
      partNumber: '6ES7134-6HD01-0BA1',
      description: 'REPUESTOS ELECTRICOS SIEMENS 6ES7134-6HD01-0BA1',
      quantity: 2,
      baseUnitCostUsd: 180.0,
      adValoremRate: 0,
      marginRatePct: 40,
    },
  ]);

  // Recálculo Reactivo Instantáneo
  const globalParams: QuoteGlobalParams = useMemo(
    () => ({
      origin,
      prorationMethod,
      marginStrategy,
      totalFreightUsd,
      totalHandlingUsd,
      exchangeRatePen,
    }),
    [origin, prorationMethod, marginStrategy, totalFreightUsd, totalHandlingUsd, exchangeRatePen]
  );

  const summary = useMemo(() => calculateQuote(rawItems, globalParams), [rawItems, globalParams]);

  // Handlers
  const handleUpdateItem = (id: string, updates: Partial<RawItemInput>) => {
    setRawItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setRawItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    setRawItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        partNumber: '6ES7132-6BF01-0AA0',
        description: 'REPUESTOS SIEMENS 6ES7132-6BF01-0AA0',
        quantity: 1,
        baseUnitCostUsd: 75.0,
        adValoremRate: 0,
        marginRatePct: 45,
      },
    ]);
  };

  const handleApplyBulkMargin = (marginPct: number) => {
    setRawItems((prev) => prev.map((it) => ({ ...it, marginRatePct: marginPct })));
  };

  const handleItemsParsed = (newItems: RawItemInput[]) => {
    setRawItems((prev) => [...prev, ...newItems]);
  };

  return (
    <div className="min-h-screen bg-[#0b241c] pb-32 text-slate-100">
      {/* Header Corporativo Skiz-Style */}
      <header className="border-b border-[#1d4034] bg-[#0b241c]/90 px-6 py-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white p-1 border border-[#57cc99]/40 flex items-center justify-center shadow-md">
              <img
                src="/bicode-logo.png"
                alt="Logo Bicode Control"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                QuickQuote Industrial
                <span className="rounded-full bg-[#57cc99]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#57cc99]">
                  Bicode Control S.A.C.
                </span>
              </h1>
              <p className="text-xs text-[#a8b5b0]">Cálculo Landed Cost & Emisión de Proformas Perú</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPasteOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[#57cc99] px-5 py-2 text-xs font-bold text-[#0b241c] hover:bg-[#80ed99] transition-all shadow-lg"
            >
              <Sparkles className="h-4 w-4" /> Quick Paste / Pegado Masivo
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Parámetros & Cliente */}
        <QuoteHeaderConfig
          origin={origin}
          onOriginChange={setOrigin}
          prorationMethod={prorationMethod}
          onProrationChange={setProrationMethod}
          marginStrategy={marginStrategy}
          onMarginStrategyChange={setMarginStrategy}
          totalFreightUsd={totalFreightUsd}
          onFreightChange={setTotalFreightUsd}
          totalHandlingUsd={totalHandlingUsd}
          onHandlingChange={setTotalHandlingUsd}
          exchangeRatePen={exchangeRatePen}
          onExchangeRateChange={setExchangeRatePen}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />

        {/* Tabla Editable */}
        <QuoteItemsTable
          rawItems={rawItems}
          calculatedItems={summary.items}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleAddItem}
          onApplyBulkMargin={handleApplyBulkMargin}
        />
      </main>

      {/* Barra de KPIs Inferior Fija */}
      <KpiSummaryBar
        summary={summary}
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      {/* Modal de Pegado Rápido */}
      <QuickPasteModal
        isOpen={isPasteOpen}
        onClose={() => setIsPasteOpen(false)}
        onItemsParsed={handleItemsParsed}
      />

      {/* Modal Proforma Oficial Idéntica a Bicode Control */}
      <BicodeProformaView
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        summary={summary}
        customer={selectedCustomer}
        quoteNumber="0001-0000928"
      />
    </div>
  );
}

