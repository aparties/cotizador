'use client';

import { QuoteSummary } from '@/services/pricing-engine';
import { DollarSign, ShieldAlert, X, CreditCard, ArrowRight } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  summary: QuoteSummary;
  exchangeRatePen: number;
};

export function CashFlowModal({ isOpen, onClose, summary, exchangeRatePen }: Props) {
  if (!isOpen) return null;

  // Cálculos agregados de crédito fiscal
  const totalCifUsd = summary.items.reduce((acc, it) => acc + (it.cifUnitUsd * it.quantity), 0);
  const totalAdValoremUsd = summary.items.reduce((acc, it) => acc + (it.adValoremUnitUsd * it.quantity), 0);
  const totalIgvAduanaUsd = summary.items.reduce((acc, it) => acc + (it.igvAduaneroUnitUsd * it.quantity), 0);
  const totalPercepcionUsd = summary.items.reduce((acc, it) => acc + (it.percepcionUnitUsd * it.quantity), 0);
  const totalDesembolsoAduanaUsd = totalAdValoremUsd + totalIgvAduanaUsd + totalPercepcionUsd;
  const totalDesembolsoAduanaPen = totalDesembolsoAduanaUsd * exchangeRatePen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-[40px] border border-[#1d4034] bg-[#143028] p-7 shadow-2xl text-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1d4034]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Impacto en Flujo de Caja (SUNAT / Aduanas)</h3>
              <p className="text-xs text-[#a8b5b0]">Tributos y Percepciones requeridos para el levante de carga</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#a8b5b0] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nota Explicativa */}
        <div className="rounded-2xl bg-[#081a14] p-3.5 border border-[#1d4034] text-xs text-[#a8b5b0] flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Nota Tributaria Perú:</strong> El IGV Aduanero (18%) y la Percepción (3.5%) no forman parte del costo contable (son <em>crédito fiscal</em> deducible), pero representan un <strong className="text-amber-300">desembolso de efectivo real inicial</strong> que Bicode Control debe pagar en banco antes de retirar la mercadería del almacén aduanero.
          </p>
        </div>

        {/* Desglose Numérico */}
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1.5 px-3 rounded-xl bg-[#081a14]/60">
            <span className="text-[#a8b5b0]">Valor CIF Total Estimado:</span>
            <span className="font-mono font-bold text-white">${totalCifUsd.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 px-3 rounded-xl bg-[#081a14]/60">
            <span className="text-[#a8b5b0]">Arancel Ad Valorem (No Deducible - Costo):</span>
            <span className="font-mono font-bold text-white">${totalAdValoremUsd.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-200">I.G.V. Aduanero a pagar (18% - Crédito Fiscal):</span>
            <span className="font-mono font-bold text-amber-300">${totalIgvAduanaUsd.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-200">Percepción SUNAT a pagar (3.5% - Crédito Fiscal):</span>
            <span className="font-mono font-bold text-amber-300">${totalPercepcionUsd.toFixed(2)}</span>
          </div>

          {/* Total Desembolso */}
          <div className="flex justify-between items-center pt-3 border-t border-[#1d4034] text-sm">
            <span className="font-bold text-white">Efectivo Requerido en Aduanas:</span>
            <div className="text-right">
              <span className="font-mono font-black text-amber-400 text-base">${totalDesembolsoAduanaUsd.toFixed(2)}</span>
              <p className="text-[10px] text-[#a8b5b0] font-mono">Ref. S/ {totalDesembolsoAduanaPen.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#57cc99] px-6 py-2 text-xs font-bold text-[#0b241c] hover:bg-[#80ed99] transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
