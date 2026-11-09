// src/services/pricing-engine.ts
export type CalculationOrigin = 'IMPORTACION' | 'NACIONAL';
export type ProrationType = 'BY_VALUE' | 'BY_UNIT';
export type MarginType = 'MARKUP' | 'GROSS_MARGIN';

export interface RawItemInput {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  baseUnitCostUsd: number;
  adValoremRate: number; // 0, 6 o 11
  marginRatePct: number; // Ej: 45 para 45%
}

export interface QuoteGlobalParams {
  origin: CalculationOrigin;
  prorationMethod: ProrationType;
  marginStrategy: MarginType;
  totalFreightUsd: number;
  totalHandlingUsd: number;
  exchangeRatePen: number;
  includeCashFlowImpact?: boolean;
}

export interface CalculatedItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  baseUnitCostUsd: number;
  proratedFreightUnitUsd: number;
  estimatedInsuranceUnitUsd: number;
  cifUnitUsd: number;
  adValoremUnitUsd: number;
  proratedExpensesUnitUsd: number;
  landedUnitCostUsd: number;
  totalLandedCostUsd: number;
  unitSalePriceNetUsd: number;
  totalSalePriceNetUsd: number;
  totalSalePriceWithIgvUsd: number;
  unitSalePriceNetPen: number;
  totalSalePriceWithIgvPen: number;
  unitProfitUsd: number;
  totalProfitUsd: number;
  grossMarginPct: number;
  igvAduaneroUnitUsd: number;
  percepcionUnitUsd: number;
}

export interface QuoteSummary {
  totalFobUsd: number;
  totalLandedCostUsd: number;
  subtotalNetUsd: number;
  subtotalNetPen: number;
  totalIgvUsd: number;
  totalIgvPen: number;
  totalFinalUsd: number;
  totalFinalPen: number;
  totalProfitUsd: number;
  profitabilityPct: number;
  totalTaxCashOutlayUsd: number;
  advancePaymentUsd: number;
  balancePaymentUsd: number;
  items: CalculatedItem[];
}

const SUNAT_INSURANCE_RATE = 0.0075; // 0.75% tabla SUNAT
const IGV_RATE = 0.18;               // 18% Perú
const PERCEPTION_RATE = 0.035;       // 3.5%

export const MARGIN_PROFILES = {
  DISTRIBUIDOR: { label: 'Lote / Distribuidor (30%)', markup: 30 },
  CLIENTE_FINAL: { label: 'Cliente Estándar (45%)', markup: 45 },
  CRITICO_STOCK: { label: 'Stock / Inmediato (65%)', markup: 65 },
} as const;

export function calculateQuote(
  items: RawItemInput[],
  params: QuoteGlobalParams
): QuoteSummary {
  const totalBaseAmount = items.reduce((acc, it) => acc + (it.baseUnitCostUsd || 0) * (it.quantity || 1), 0);
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const calculatedItems: CalculatedItem[] = items.map((item) => {
    const qty = Math.max(1, item.quantity || 1);
    const itemTotalBase = (item.baseUnitCostUsd || 0) * qty;

    let prorationFactor = 0;
    if (params.prorationMethod === 'BY_VALUE') {
      prorationFactor = totalBaseAmount > 0 ? itemTotalBase / totalBaseAmount : 0;
    } else {
      prorationFactor = totalUnits > 0 ? qty / totalUnits : 0;
    }

    const itemFreightTotal = (params.totalFreightUsd || 0) * prorationFactor;
    const freightUnit = itemFreightTotal / qty;

    const itemExpensesTotal = (params.totalHandlingUsd || 0) * prorationFactor;
    const expensesUnit = itemExpensesTotal / qty;

    let insuranceUnit = 0;
    let cifUnit = 0;
    let adValoremUnit = 0;
    let igvAduaneroUnit = 0;
    let percepcionUnit = 0;

    if (params.origin === 'IMPORTACION') {
      const cfrUnit = (item.baseUnitCostUsd || 0) + freightUnit;
      insuranceUnit = cfrUnit * SUNAT_INSURANCE_RATE;
      cifUnit = cfrUnit + insuranceUnit;
      adValoremUnit = cifUnit * ((item.adValoremRate || 0) / 100);

      const baseIgvAduana = cifUnit + adValoremUnit;
      igvAduaneroUnit = baseIgvAduana * IGV_RATE;
      percepcionUnit = (baseIgvAduana + igvAduaneroUnit) * PERCEPTION_RATE;
    }

    const landedUnitCostUsd =
      (item.baseUnitCostUsd || 0) + freightUnit + expensesUnit + adValoremUnit;
    const totalLandedCostUsd = landedUnitCostUsd * qty;

    let unitSalePriceNetUsd = 0;
    const marginRate = (item.marginRatePct || 0) / 100;

    if (params.marginStrategy === 'MARKUP') {
      unitSalePriceNetUsd = landedUnitCostUsd * (1 + marginRate);
    } else {
      unitSalePriceNetUsd = marginRate < 1 ? landedUnitCostUsd / (1 - marginRate) : landedUnitCostUsd;
    }

    const totalSalePriceNetUsd = unitSalePriceNetUsd * qty;
    const totalSalePriceWithIgvUsd = totalSalePriceNetUsd * (1 + IGV_RATE);

    const tc = params.exchangeRatePen || 3.75;
    const unitSalePriceNetPen = unitSalePriceNetUsd * tc;
    const totalSalePriceWithIgvPen = totalSalePriceWithIgvUsd * tc;

    const unitProfitUsd = unitSalePriceNetUsd - landedUnitCostUsd;
    const totalProfitUsd = totalSalePriceNetUsd - totalLandedCostUsd;
    const grossMarginPct =
      totalSalePriceNetUsd > 0 ? (totalProfitUsd / totalSalePriceNetUsd) * 100 : 0;

    return {
      id: item.id,
      partNumber: item.partNumber || '',
      description: item.description || '',
      quantity: qty,
      baseUnitCostUsd: Number((item.baseUnitCostUsd || 0).toFixed(4)),
      proratedFreightUnitUsd: Number(freightUnit.toFixed(4)),
      estimatedInsuranceUnitUsd: Number(insuranceUnit.toFixed(4)),
      cifUnitUsd: Number(cifUnit.toFixed(4)),
      adValoremUnitUsd: Number(adValoremUnit.toFixed(4)),
      proratedExpensesUnitUsd: Number(expensesUnit.toFixed(4)),
      landedUnitCostUsd: Number(landedUnitCostUsd.toFixed(4)),
      totalLandedCostUsd: Number(totalLandedCostUsd.toFixed(4)),
      unitSalePriceNetUsd: Number(unitSalePriceNetUsd.toFixed(2)),
      totalSalePriceNetUsd: Number(totalSalePriceNetUsd.toFixed(2)),
      totalSalePriceWithIgvUsd: Number(totalSalePriceWithIgvUsd.toFixed(2)),
      unitSalePriceNetPen: Number(unitSalePriceNetPen.toFixed(2)),
      totalSalePriceWithIgvPen: Number(totalSalePriceWithIgvPen.toFixed(2)),
      unitProfitUsd: Number(unitProfitUsd.toFixed(2)),
      totalProfitUsd: Number(totalProfitUsd.toFixed(2)),
      grossMarginPct: Number(grossMarginPct.toFixed(2)),
      igvAduaneroUnitUsd: Number(igvAduaneroUnit.toFixed(4)),
      percepcionUnitUsd: Number(percepcionUnit.toFixed(4)),
    };
  });

  const totalFobUsd = totalBaseAmount;
  const totalLandedCostUsd = calculatedItems.reduce((acc, it) => acc + it.totalLandedCostUsd, 0);
  const subtotalNetUsd = calculatedItems.reduce((acc, it) => acc + it.totalSalePriceNetUsd, 0);
  const totalIgvUsd = subtotalNetUsd * IGV_RATE;
  const totalFinalUsd = subtotalNetUsd + totalIgvUsd;

  const tc = params.exchangeRatePen || 3.75;
  const subtotalNetPen = subtotalNetUsd * tc;
  const totalIgvPen = totalIgvUsd * tc;
  const totalFinalPen = totalFinalUsd * tc;

  const totalProfitUsd = subtotalNetUsd - totalLandedCostUsd;
  const profitabilityPct =
    subtotalNetUsd > 0 ? (totalProfitUsd / subtotalNetUsd) * 100 : 0;

  const totalTaxCashOutlayUsd = calculatedItems.reduce(
    (acc, it) => acc + (it.igvAduaneroUnitUsd + it.percepcionUnitUsd) * it.quantity,
    0
  );

  return {
    totalFobUsd: Number(totalFobUsd.toFixed(2)),
    totalLandedCostUsd: Number(totalLandedCostUsd.toFixed(2)),
    subtotalNetUsd: Number(subtotalNetUsd.toFixed(2)),
    subtotalNetPen: Number(subtotalNetPen.toFixed(2)),
    totalIgvUsd: Number(totalIgvUsd.toFixed(2)),
    totalIgvPen: Number(totalIgvPen.toFixed(2)),
    totalFinalUsd: Number(totalFinalUsd.toFixed(2)),
    totalFinalPen: Number(totalFinalPen.toFixed(2)),
    totalProfitUsd: Number(totalProfitUsd.toFixed(2)),
    profitabilityPct: Number(profitabilityPct.toFixed(2)),
    totalTaxCashOutlayUsd: Number(totalTaxCashOutlayUsd.toFixed(2)),
    advancePaymentUsd: Number((totalFinalUsd * 0.6).toFixed(2)),
    balancePaymentUsd: Number((totalFinalUsd * 0.4).toFixed(2)),
    items: calculatedItems,
  };
}

