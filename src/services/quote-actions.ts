'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { calculateQuote, RawItemInput, QuoteGlobalParams } from './pricing-engine';
import { numberToLetters } from '@/utils/number-to-letters';
import { resolvePartDescription } from './part-lookup';

export interface SaveQuoteInput {
  customer: {
    ruc: string;
    businessName: string;
    address: string;
    paymentTerm?: string;
    paymentCondition?: string;
  };
  globalParams: QuoteGlobalParams;
  rawItems: RawItemInput[];
  deliveryTimeDays?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
}

export type SaveQuoteResult =
  | { success: true; quote: any; code: string }
  | { success: false; error: string };

export async function saveQuoteToDatabase(input: SaveQuoteInput): Promise<SaveQuoteResult> {
  try {
    return await withTimeout(
      (async () => {
        const summary = calculateQuote(input.rawItems, input.globalParams);

        // 1. Obtener correlativo siguiente tipo Bicode Control (0001-0000929...)
        const lastQuote = await prisma.quote.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { code: true },
        });

        let nextCorrelative = 929;
        if (lastQuote && lastQuote.code) {
          const parts = lastQuote.code.split('-');
          if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextCorrelative = num + 1;
          }
        }
        const code = `0001-${nextCorrelative.toString().padStart(7, '0')}`;

        // 2. Buscar o crear cliente por RUC
        let customerId: string | undefined = undefined;
        if (input.customer.ruc) {
          const existingCustomer = await prisma.customer.upsert({
            where: { ruc: input.customer.ruc },
            update: {
              businessName: input.customer.businessName,
              address: input.customer.address,
            },
            create: {
              ruc: input.customer.ruc,
              businessName: input.customer.businessName,
              address: input.customer.address,
              defaultPaymentTerm: input.customer.paymentTerm || '60 DÍAS',
              defaultCondition: input.customer.paymentCondition || 'CRÉDITO',
            },
          });
          customerId = existingCustomer.id;
        }

        // 3. Fechas
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 60);

        const totalInLetters = numberToLetters(summary.totalFinalUsd, 'DOLARES AMERICANOS');

        // 4. Crear Cotización e Ítems en Neon PostgreSQL
        const saved = await prisma.quote.create({
          data: {
            code,
            status: 'ENVIADA',
            origin: input.globalParams.origin,
            prorationMethod: input.globalParams.prorationMethod,
            marginStrategy: input.globalParams.marginStrategy,
            customerId,
            clientRuc: input.customer.ruc || '20605524126',
            clientBusinessName: input.customer.businessName || 'CLIENTE S.A.C.',
            clientAddress: input.customer.address || 'LIMA - PERÚ',
            issueDate,
            dueDate,
            currency: 'DOLARES AMERICANOS',
            deliveryTimeDays: input.deliveryTimeDays || '21 DÍAS',
            paymentTerm: input.customer.paymentTerm || '60 DÍAS',
            paymentCondition: input.customer.paymentCondition || 'CRÉDITO',
            totalIntlFreightUsd: input.globalParams.totalFreightUsd,
            totalHandlingUsd: input.globalParams.totalHandlingUsd,
            exchangeRateValue: input.globalParams.exchangeRatePen,
            subtotalGravadoUsd: summary.subtotalNetUsd,
            igvAmountUsd: summary.totalIgvUsd,
            totalAmountUsd: summary.totalFinalUsd,
            totalAmountLetters: totalInLetters,
            totalCostLandedUsd: summary.totalLandedCostUsd,
            grossProfitUsd: summary.totalProfitUsd,
            items: {
              create: summary.items.map((it, idx) => ({
                position: idx + 1,
                partNumber: it.partNumber,
                description: it.description,
                quantity: it.quantity,
                baseUnitCostUsd: it.baseUnitCostUsd,
                proratedFreightUsd: it.proratedFreightUnitUsd,
                proratedInsuranceUsd: it.estimatedInsuranceUnitUsd,
                adValoremRate: input.rawItems[idx]?.adValoremRate || 0,
                adValoremAmountUsd: it.adValoremUnitUsd,
                proratedExpensesUsd: it.proratedExpensesUnitUsd,
                landedUnitCostUsd: it.landedUnitCostUsd,
                totalLandedCostUsd: it.totalLandedCostUsd,
                marginRatePct: input.rawItems[idx]?.marginRatePct || 45,
                unitSalePriceNetUsd: it.unitSalePriceNetUsd,
                totalSalePriceNetUsd: it.totalSalePriceNetUsd,
                totalSalePriceWithIgvUsd: it.totalSalePriceWithIgvUsd,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        revalidatePath('/');
        return { success: true, quote: saved, code };
      })(),
      15000,
      'Tiempo de espera agotado al conectar con Neon PostgreSQL (15s).'
    );
  } catch (error: unknown) {
    console.error('Error guardando proforma en Neon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al conectar con Neon PostgreSQL.',
    };
  }
}

export async function getRecentQuotes() {
  try {
    const quotes = await prisma.quote.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return { success: true, quotes };
  } catch (error) {
    return { success: false, quotes: [] };
  }
}

export async function batchResolveDescriptions(
  items: { partNumber: string; hasUserDescription: boolean; description?: string }[]
) {
  try {
    const resolved = await Promise.all(
      items.map(async (item) => {
        if (item.hasUserDescription && item.description && item.description.trim()) {
          return {
            partNumber: item.partNumber,
            description: item.description.trim(),
          };
        }
        const desc = await resolvePartDescription(item.partNumber);
        return {
          partNumber: item.partNumber,
          description: desc,
        };
      })
    );
    return { success: true, items: resolved };
  } catch (error) {
    console.error('Error in batchResolveDescriptions:', error);
    return { success: false, items: [] };
  }
}


