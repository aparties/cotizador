'use client';

import { CalculationOrigin, ProrationType, MarginType } from '@/services/pricing-engine';
import { Truck, Calculator } from 'lucide-react';
import { CustomerSelector, SelectedCustomer } from './CustomerSelector';

type Props = {
  origin: CalculationOrigin;
  onOriginChange: (val: CalculationOrigin) => void;
  prorationMethod: ProrationType;
  onProrationChange: (val: ProrationType) => void;
  marginStrategy: MarginType;
  onMarginStrategyChange: (val: MarginType) => void;
  totalFreightUsd: number;
  onFreightChange: (val: number) => void;
  totalHandlingUsd: number;
  onHandlingChange: (val: number) => void;
  exchangeRatePen: number;
  onExchangeRateChange: (val: number) => void;
  selectedCustomer: SelectedCustomer;
  onSelectCustomer: (cust: SelectedCustomer) => void;
};

export function QuoteHeaderConfig({
  origin,
  onOriginChange,
  prorationMethod,
  onProrationChange,
  marginStrategy,
  onMarginStrategyChange,
  totalFreightUsd,
  onFreightChange,
  totalHandlingUsd,
  onHandlingChange,
  exchangeRatePen,
  onExchangeRateChange,
  selectedCustomer,
  onSelectCustomer,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 1. Selector de Cliente */}
      <CustomerSelector
        selectedCustomer={selectedCustomer}
        onSelectCustomer={onSelectCustomer}
      />

      {/* 2. Logística y Costos de Importación */}
      <div className="rounded-[32px] border border-[#1d4034] bg-[#143028] p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between text-sm font-bold text-white">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#57cc99]" />
            <span>Logística Prorrateable</span>
          </div>
          <div className="flex rounded-full bg-[#081a14] p-0.5 border border-[#1d4034]">
            <button
              type="button"
              onClick={() => onOriginChange('IMPORTACION')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                origin === 'IMPORTACION' ? 'bg-[#57cc99] text-[#0b241c]' : 'text-[#a8b5b0]'
              }`}
            >
              Exterior
            </button>
            <button
              type="button"
              onClick={() => onOriginChange('NACIONAL')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                origin === 'NACIONAL' ? 'bg-[#57cc99] text-[#0b241c]' : 'text-[#a8b5b0]'
              }`}
            >
              Local
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-semibold text-[#57cc99]">FLETE TOTAL (USD)</label>
            <input
              type="number"
              step="any"
              value={totalFreightUsd === 0 ? '' : totalFreightUsd}
              onChange={(e) => onFreightChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-4 py-2 text-xs font-mono text-white focus:border-[#57cc99] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#57cc99]">GASTOS ADUANA/AGENTE</label>
            <input
              type="number"
              step="any"
              value={totalHandlingUsd === 0 ? '' : totalHandlingUsd}
              onChange={(e) => onHandlingChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-4 py-2 text-xs font-mono text-white focus:border-[#57cc99] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Parámetros de Moneda y Prorrateo */}
      <div className="rounded-[32px] border border-[#1d4034] bg-[#143028] p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <Calculator className="h-4 w-4 text-[#57cc99]" />
          <span>Fórmulas & T.C.</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-[#57cc99]">T.C. SUNAT</label>
            <input
              type="number"
              step="0.001"
              value={exchangeRatePen}
              onChange={(e) => onExchangeRateChange(parseFloat(e.target.value) || 3.75)}
              className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-3 py-2 text-xs font-mono text-white focus:border-[#57cc99] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#57cc99]">PRORRATEO</label>
            <select
              value={prorationMethod}
              onChange={(e) => onProrationChange(e.target.value as ProrationType)}
              className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-2 py-2 text-[11px] text-white focus:outline-none"
            >
              <option value="BY_VALUE">Por Valor FOB</option>
              <option value="BY_UNIT">Por Cantidad</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#57cc99]">ESTRATEGIA</label>
            <select
              value={marginStrategy}
              onChange={(e) => onMarginStrategyChange(e.target.value as MarginType)}
              className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-2 py-2 text-[11px] text-white focus:outline-none"
            >
              <option value="MARKUP">Markup (Costo*F)</option>
              <option value="GROSS_MARGIN">Margen s/Venta</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

