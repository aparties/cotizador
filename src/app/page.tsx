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
import { CashFlowModal } from '@/components/quote/CashFlowModal';
import { QuoteHistoryModal } from '@/components/quote/QuoteHistoryModal';
import { saveQuoteToDatabase } from '@/services/quote-actions';
import Logo from '@/components/Logo';
import { Sparkles, History } from 'lucide-react';

export default function Home() {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCashFlowOpen, setIsCashFlowOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuoteCode, setCurrentQuoteCode] = useState('0001-0000928');

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

  const handleSaveQuote = async () => {
    setIsSaving(true);
    const res = await saveQuoteToDatabase({
      customer: selectedCustomer,
      globalParams,
      rawItems,
    });
    setIsSaving(false);

    if (res.success && res.code) {
      setCurrentQuoteCode(res.code);
      alert(`✅ ¡Cotización guardada exitosamente en Neon PostgreSQL con código ${res.code}!`);
    } else {
      alert(`⚠️ ${res.error || 'No se pudo conectar a Neon. Verifica que la variable DATABASE_URL esté configurada en el archivo .env'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b241c] pb-32 text-slate-100">
      {/* Header Corporativo Skiz-Style */}
      <header className="border-b border-[#1d4034] bg-[#0b241c]/90 px-6 py-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-11 h-11 transition-transform hover:scale-105" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                QuickQuote Industrial
                <span className="rounded-full bg-[#57cc99]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#57cc99]">
                  Bicode Control E.I.R.L.
                </span>
              </h1>
              <p className="text-xs text-[#a8b5b0]">Cálculo Landed Cost & Emisión de Proformas Perú</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-[#1d4034] bg-[#143028] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#57cc99] hover:text-white transition-all shadow-md"
            >
              <History className="h-4 w-4 text-[#57cc99]" /> Historial Guardado
            </button>

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
        onOpenCashFlow={() => setIsCashFlowOpen(true)}
        onSave={handleSaveQuote}
        isSaving={isSaving}
      />

      {/* Modal de Pegado Rápido */}
      <QuickPasteModal
        isOpen={isPasteOpen}
        onClose={() => setIsPasteOpen(false)}
        onItemsParsed={handleItemsParsed}
      />

      {/* Modal de Flujo de Caja SUNAT (IGV Aduanero + Percepción) */}
      <CashFlowModal
        isOpen={isCashFlowOpen}
        onClose={() => setIsCashFlowOpen(false)}
        summary={summary}
        exchangeRatePen={exchangeRatePen}
      />

      {/* Modal Historial de Cotizaciones desde Neon */}
      <QuoteHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectQuoteToView={(q) => {
          setCurrentQuoteCode(q.code);
          if (q.clientBusinessName) {
            setSelectedCustomer({
              ruc: q.clientRuc,
              businessName: q.clientBusinessName,
              address: q.clientAddress,
              paymentTerm: q.paymentTerm,
              paymentCondition: q.paymentCondition,
            });
          }
          if (q.items && q.items.length > 0) {
            setRawItems(
              q.items.map((it: any) => ({
                id: it.id,
                partNumber: it.partNumber,
                description: it.description,
                quantity: it.quantity,
                baseUnitCostUsd: Number(it.baseUnitCostUsd),
                adValoremRate: Number(it.adValoremRate),
                marginRatePct: Number(it.marginRatePct),
              }))
            );
          }
          setIsPrintOpen(true);
        }}
      />

      {/* Modal Proforma Oficial Idéntica a Bicode Control */}
      <BicodeProformaView
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        summary={summary}
        customer={selectedCustomer}
        quoteNumber={currentQuoteCode}
      />
    </div>
  );
}

