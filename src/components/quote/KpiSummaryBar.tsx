'use client';

import { QuoteSummary } from '@/services/pricing-engine';
import { TrendingUp, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

type Props = {
  summary: QuoteSummary;
  onOpenPrint: () => void;
  onOpenCashFlow?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
};

export function KpiSummaryBar({ summary, onOpenPrint, onOpenCashFlow, onSave, isSaving = false }: Props) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1d4034] bg-[#0b241c]/95 backdrop-blur-lg px-6 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[11px] font-semibold uppercase text-[#57cc99]">Costo Landed Total</span>
            <p className="text-base font-bold text-white">${summary.totalLandedCostUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="h-8 w-px bg-[#1d4034]" />

          <div>
            <span className="text-[11px] font-semibold uppercase text-[#57cc99]">Venta Neta (Sin IGV)</span>
            <p className="text-base font-bold text-white">
              ${summary.subtotalNetUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="ml-1 text-xs text-[#a8b5b0]">/ S/ {summary.subtotalNetPen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>

          <div className="h-8 w-px bg-[#1d4034]" />

          <div>
            <span className="text-[11px] font-semibold uppercase text-[#57cc99]">Utilidad Proyectada</span>
            <p className="flex items-center gap-1 text-base font-bold text-[#80ed99]">
              <TrendingUp className="h-4 w-4" />
              ${summary.totalProfitUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({summary.profitabilityPct}%)
            </p>
          </div>

          <div className="hidden lg:block">
            <span className="text-[11px] font-semibold uppercase text-[#a8b5b0]">Pago Sugerido (60% / 40%)</span>
            <p className="text-xs text-[#a8b5b0]">
              Adelanto: ${summary.advancePaymentUsd} | Saldo: ${summary.balancePaymentUsd}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenCashFlow && (
            <button
              type="button"
              onClick={onOpenCashFlow}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
            >
              Flujo de Caja SUNAT
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPrint}
            className="flex items-center gap-2 rounded-full border border-[#1d4034] bg-[#143028] px-5 py-2.5 text-sm font-bold text-white hover:border-[#57cc99] hover:bg-[#1d4034] transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#57cc99]" /> Ver Proforma Bicode
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            className="flex items-center gap-2 rounded-full bg-[#57cc99] px-7 py-2.5 text-sm font-bold text-[#0b241c] transition-all hover:bg-[#80ed99] shadow-lg disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> {isSaving ? 'Guardando en Neon...' : 'Guardar en Base de Datos'}
          </button>
        </div>
      </div>
    </footer>
  );
}

