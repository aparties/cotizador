'use client';

import { useState } from 'react';
import { CalculatedItem, RawItemInput, MARGIN_PROFILES } from '@/services/pricing-engine';
import { Trash2, Plus, Check } from 'lucide-react';
import { ProductAutocomplete } from './ProductAutocomplete';

type Props = {
  rawItems: RawItemInput[];
  calculatedItems: CalculatedItem[];
  onUpdateItem: (id: string, updates: Partial<RawItemInput>) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onApplyBulkMargin: (marginPct: number) => void;
};

export function QuoteItemsTable({
  rawItems,
  calculatedItems,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onApplyBulkMargin,
}: Props) {
  const [customMarkup, setCustomMarkup] = useState('');

  const handleApplyCustom = () => {
    const val = parseFloat(customMarkup);
    if (!isNaN(val) && val >= 0) {
      onApplyBulkMargin(val);
    }
  };
  return (
    <div className="rounded-[40px] border border-[#1d4034] bg-[#143028] p-6 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">Partidas / Repuestos ({rawItems.length})</span>
          <div className="flex items-center gap-1.5 rounded-full bg-[#081a14] p-1 border border-[#1d4034]">
            <span className="px-2 text-[10px] font-semibold text-[#57cc99] uppercase">Markup Masivo:</span>
            <button
              type="button"
              onClick={() => onApplyBulkMargin(MARGIN_PROFILES.DISTRIBUIDOR.markup)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#a8b5b0] hover:bg-[#57cc99]/20 hover:text-white"
            >
              Lote 30%
            </button>
            <button
              type="button"
              onClick={() => onApplyBulkMargin(MARGIN_PROFILES.CLIENTE_FINAL.markup)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#a8b5b0] hover:bg-[#57cc99]/20 hover:text-white"
            >
              Estándar 45%
            </button>
            <button
              type="button"
              onClick={() => onApplyBulkMargin(MARGIN_PROFILES.CRITICO_STOCK.markup)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#a8b5b0] hover:bg-[#57cc99]/20 hover:text-white transition-colors"
            >
              Crítico 65%
            </button>

            {/* Campo Custom para otro porcentaje */}
            <div className="flex items-center gap-1 border-l border-[#1d4034] pl-2 pr-1">
              <span className="text-[10px] font-semibold text-[#a8b5b0]">Custom:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  placeholder="%"
                  value={customMarkup}
                  onChange={(e) => setCustomMarkup(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCustom();
                    }
                  }}
                  className="w-14 rounded-full bg-[#143028] border border-[#1d4034] px-2 py-0.5 text-center font-mono text-[11px] font-bold text-white placeholder-emerald-100/30 focus:border-[#57cc99] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="rounded-full bg-[#57cc99] px-2.5 py-0.5 text-[10px] font-bold text-[#0b241c] hover:bg-[#80ed99] transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1.5 rounded-full bg-[#081a14] border border-[#1d4034] px-4 py-2 text-xs font-bold text-[#57cc99] hover:bg-[#57cc99]/20"
        >
          <Plus className="h-4 w-4" /> Agregar Fila
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1d4034] text-[11px] font-semibold uppercase text-[#57cc99]">
              <th className="pb-3 pl-2 w-48">Part Number (Autocompleta)</th>
              <th className="pb-3">Descripción Técnica</th>
              <th className="pb-3 text-center w-20">Cant.</th>
              <th className="pb-3 w-28">Costo FOB</th>
              <th className="pb-3 w-20">Arancel</th>
              <th className="pb-3 w-28">Landed Unit</th>
              <th className="pb-3 w-24">% Margen</th>
              <th className="pb-3 w-28 text-right">P. Venta Net</th>
              <th className="pb-3 w-28 text-right pr-2">Total Net</th>
              <th className="pb-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1d4034]/60">
            {calculatedItems.map((calc) => {
              const raw = rawItems.find((r) => r.id === calc.id);
              if (!raw) return null;

              return (
                <tr key={calc.id} className="group hover:bg-[#081a14]/40 transition-colors">
                  <td className="py-2.5 pl-2">
                    <ProductAutocomplete
                      value={raw.partNumber}
                      onChange={(val) => onUpdateItem(calc.id, { partNumber: val })}
                      onSelectProduct={(p) => {
                        onUpdateItem(calc.id, {
                          partNumber: p.partNumber,
                          description: p.description,
                          baseUnitCostUsd: p.price,
                        });
                      }}
                    />
                  </td>

                  <td className="py-2.5">
                    <input
                      type="text"
                      value={raw.description}
                      onChange={(e) => onUpdateItem(calc.id, { description: e.target.value })}
                      className="w-full min-w-[200px] rounded-xl border border-transparent bg-transparent px-2 py-1 text-slate-300 hover:border-[#1d4034] focus:border-[#57cc99] focus:bg-[#081a14] focus:outline-none"
                    />
                  </td>

                  <td className="py-2.5 text-center">
                    <input
                      type="number"
                      min={1}
                      value={raw.quantity}
                      onChange={(e) => onUpdateItem(calc.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="w-16 rounded-xl border border-[#1d4034] bg-[#081a14] px-2 py-1 text-center font-mono font-bold text-white focus:border-[#57cc99] focus:outline-none"
                    />
                  </td>

                  <td className="py-2.5">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-[#a8b5b0]">$</span>
                      <input
                        type="number"
                        step="any"
                        value={raw.baseUnitCostUsd === 0 ? '' : raw.baseUnitCostUsd}
                        onChange={(e) => onUpdateItem(calc.id, { baseUnitCostUsd: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded-xl border border-[#1d4034] bg-[#081a14] pl-6 pr-2 py-1 font-mono text-white focus:border-[#57cc99] focus:outline-none"
                      />
                    </div>
                  </td>

                  <td className="py-2.5">
                    <select
                      value={raw.adValoremRate}
                      onChange={(e) => onUpdateItem(calc.id, { adValoremRate: parseFloat(e.target.value) })}
                      className="rounded-xl border border-[#1d4034] bg-[#081a14] px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value={0}>0%</option>
                      <option value={6}>6%</option>
                      <option value={11}>11%</option>
                    </select>
                  </td>

                  <td className="py-2.5">
                    <span className="font-mono font-semibold text-[#80ed99]">
                      ${calc.landedUnitCostUsd.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-[#a8b5b0]">
                      flete: +${calc.proratedFreightUnitUsd.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        value={raw.marginRatePct}
                        onChange={(e) => onUpdateItem(calc.id, { marginRatePct: parseFloat(e.target.value) || 0 })}
                        className="w-18 rounded-xl border border-[#1d4034] bg-[#081a14] pl-2 pr-5 py-1 font-mono font-bold text-white focus:border-[#57cc99] focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-[#57cc99]">%</span>
                    </div>
                  </td>

                  <td className="py-2.5 text-right font-mono font-bold text-white">
                    ${calc.unitSalePriceNetUsd.toFixed(2)}
                  </td>

                  <td className="py-2.5 pr-2 text-right font-mono font-bold text-[#57cc99]">
                    ${calc.totalSalePriceNetUsd.toFixed(2)}
                  </td>

                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(calc.id)}
                      className="rounded-lg p-1.5 text-[#a8b5b0] hover:bg-rose-500/20 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

