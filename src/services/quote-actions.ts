'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { calculateQuote, RawItemInput, QuoteGlobalParams } from './pricing-engine';
import { numberToLetters } from '@/utils/number-to-letters';
import { resolvePartDescription } from './part-lookup';
import { lookupPartsWithGemini } from './gemini-lookup';
import { CURATED_PARTS, getQuickDescription } from '@/utils/industrial-catalog';

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
  | { success: true; quoteId: string; code: string }
  | { success: false; error: string };

export async function saveQuoteToDatabase(input: SaveQuoteInput): Promise<SaveQuoteResult> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: 'La variable de entorno DATABASE_URL no está configurada en Vercel. Ve a Vercel > Settings > Environment Variables y agrega DATABASE_URL con la URL de Neon PostgreSQL.',
    };
  }

  try {
    return await withTimeout(
      (async () => {
        const summary = calculateQuote(input.rawItems, input.globalParams);

        // 1. Obtener correlativo serie 0002 (para no colisionar con app externa de facturación)
        const lastQuote = await prisma.quote.findFirst({
          where: { code: { startsWith: '0002-' } },
          orderBy: { createdAt: 'desc' },
          select: { code: true },
        });

        let nextCorrelative = 1;
        if (lastQuote && lastQuote.code) {
          const parts = lastQuote.code.split('-');
          if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextCorrelative = num + 1;
          }
        }
        const code = `0002-${nextCorrelative.toString().padStart(3, '0')}`;

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
        });

        revalidatePath('/');

        // Auto-registrar piezas cotizadas en el catálogo general Product de la DB
        for (const it of summary.items) {
          if (it.partNumber) {
            try {
              const cleanPart = it.partNumber.trim().toUpperCase();
              const existing = await prisma.product.findFirst({
                where: { partNumber: cleanPart },
              });
              if (existing) {
                await prisma.product.update({
                  where: { id: existing.id },
                  data: {
                    description: it.description || existing.description,
                    purchaseCost: it.baseUnitCostUsd > 0 ? it.baseUnitCostUsd : existing.purchaseCost,
                    basePrice: it.unitSalePriceNetUsd > 0 ? it.unitSalePriceNetUsd : existing.basePrice,
                  },
                });
              } else {
                await prisma.product.create({
                  data: {
                    internalCode: `QUOTED-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    partNumber: cleanPart,
                    description: it.description,
                    purchaseCost: it.baseUnitCostUsd,
                    basePrice: it.unitSalePriceNetUsd,
                    category: 'REPUESTOS INDUSTRIALES',
                    brand: cleanPart.startsWith('6ES') || cleanPart.startsWith('6SL') ? 'SIEMENS' : 'ALLEN-BRADLEY',
                  },
                });
              }
            } catch {
              // Ignore background catalog update error
            }
          }
        }

        // Return only serializable primitives to client
        return {
          success: true,
          quoteId: saved.id,
          code,
        };
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
    if (!process.env.DATABASE_URL) {
      return { success: false, quotes: [] };
    }
    const quotes = await prisma.quote.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    // Serialize Decimals and Dates to plain JSON for client components
    return { success: true, quotes: JSON.parse(JSON.stringify(quotes)) };
  } catch (error) {
    console.error('Error fetching recent quotes from Neon:', error);
    return { success: false, quotes: [] };
  }
}

export async function batchResolveDescriptions(
  items: { partNumber: string; hasUserDescription: boolean; description?: string }[]
) {
  try {
    const codesNeedingLookup = items
      .filter((it) => !it.hasUserDescription || !it.description?.trim())
      .map((it) => it.partNumber);

    // 1. Intento de resolución masiva con Gemini AI si está configurado
    let geminiMap = new Map<string, string>();
    if (codesNeedingLookup.length > 0) {
      try {
        geminiMap = await lookupPartsWithGemini(codesNeedingLookup);
      } catch (err) {
        console.warn('Gemini batch error, proceeding to catalog fallback:', err);
      }
    }

    // 2. Resolver cada ítem: Usuario -> Gemini AI -> Catálogo Curado / MLFB Rules
    const resolved = await Promise.all(
      items.map(async (item) => {
        if (item.hasUserDescription && item.description && item.description.trim()) {
          return {
            partNumber: item.partNumber,
            description: item.description.trim(),
          };
        }

        const cleanCode = item.partNumber.trim().toUpperCase();
        const geminiDesc = geminiMap.get(cleanCode);
        if (geminiDesc && geminiDesc.trim()) {
          return {
            partNumber: item.partNumber,
            description: geminiDesc.trim().toUpperCase(),
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

export interface AutocompleteProductMatch {
  partNumber: string;
  description: string;
  price: number;
  source: 'DB' | 'HISTORIAL' | 'CATALOGO';
  brand?: string;
  category?: string;
}

export async function searchProductsAndHistory(query: string): Promise<AutocompleteProductMatch[]> {
  const clean = query.trim().toUpperCase();
  if (!clean || clean.length < 2) return [];

  const results: AutocompleteProductMatch[] = [];
  const seenCodes = new Set<string>();

  // 1. Buscar en la base de datos Neon (Product y QuoteItem)
  if (process.env.DATABASE_URL) {
    try {
      const dbProducts = await prisma.product.findMany({
        where: {
          OR: [
            { partNumber: { contains: clean, mode: 'insensitive' } },
            { description: { contains: clean, mode: 'insensitive' } },
          ],
        },
        take: 8,
      });

      for (const p of dbProducts) {
        const up = p.partNumber.trim().toUpperCase();
        if (!seenCodes.has(up)) {
          seenCodes.add(up);
          results.push({
            partNumber: p.partNumber,
            description: p.description || getQuickDescription(p.partNumber),
            price: Number(p.purchaseCost) || Number(p.basePrice) || 0,
            source: 'DB',
            brand: p.brand,
            category: p.category,
          });
        }
      }

      // Buscar en ítems de cotizaciones guardadas
      const quoteItems = await prisma.quoteItem.findMany({
        where: {
          OR: [
            { partNumber: { contains: clean, mode: 'insensitive' } },
            { description: { contains: clean, mode: 'insensitive' } },
          ],
        },
        take: 8,
        orderBy: { id: 'desc' },
      });

      for (const q of quoteItems) {
        const up = q.partNumber.trim().toUpperCase();
        if (!seenCodes.has(up)) {
          seenCodes.add(up);
          results.push({
            partNumber: q.partNumber,
            description: q.description,
            price: Number(q.baseUnitCostUsd) || 0,
            source: 'HISTORIAL',
          });
        }
      }
    } catch (err) {
      console.warn('Error querying DB products for autocomplete:', err);
    }
  }

  // 2. Complementar con catálogo local curado
  for (const [code, desc] of Object.entries(CURATED_PARTS)) {
    if (results.length >= 10) break;
    const cleanCode = code.toUpperCase();
    if (cleanCode.includes(clean) || desc.toUpperCase().includes(clean)) {
      if (!seenCodes.has(cleanCode)) {
        seenCodes.add(cleanCode);
        results.push({
          partNumber: code,
          description: desc,
          price: 0,
          source: 'CATALOGO',
          brand: code.startsWith('6ES') || code.startsWith('6SL') ? 'SIEMENS' : 'ALLEN-BRADLEY',
        });
      }
    }
  }

  return results;
}


