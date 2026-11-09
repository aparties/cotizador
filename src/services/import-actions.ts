'use server';

import { prisma } from '@/lib/db';
import { getQuickDescription } from '@/utils/industrial-catalog';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  total: number;
  error?: string;
}

export async function importProductsFromExcelBase64(base64Data: string): Promise<ImportResult> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Read rows as array of arrays
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (!rows || rows.length < 3) {
      return { success: false, imported: 0, updated: 0, total: 0, error: 'El archivo Excel no contiene suficientes filas.' };
    }

    // Rows start at index 2 (Row 3 in Excel)
    // Row 2 (index 1) are headers: CÓDIGO, DESCRIPCIÓN, CATEGORIA, MARCA, ..., PRECIO VENTA, PRECIO COMPRA
    let imported = 0;
    let updated = 0;

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const internalCode = String(row[0] || '').trim();
      const rawPartNumber = String(row[1] || '').trim();
      if (!rawPartNumber) continue;

      const category = String(row[2] || 'REPUESTOS INDUSTRIALES').trim();
      const rawBrand = String(row[3] || '').trim();
      const unit = String(row[5] || 'UNIDADES').trim();
      const currency = String(row[7] || 'USD').trim();
      const salePrice = parseFloat(String(row[8] || '0')) || 0;
      const purchaseCost = parseFloat(String(row[9] || '0')) || 0;

      // Detect brand if empty
      let brand = rawBrand;
      const upperPart = rawPartNumber.toUpperCase();
      if (!brand) {
        if (upperPart.startsWith('6ES') || upperPart.startsWith('6SL') || upperPart.startsWith('6AV') || upperPart.startsWith('6EP') || upperPart.startsWith('3RT')) {
          brand = 'SIEMENS';
        } else if (upperPart.startsWith('1756') || upperPart.startsWith('1769') || upperPart.startsWith('1734')) {
          brand = 'ALLEN-BRADLEY';
        } else {
          brand = 'SIEMENS';
        }
      }

      // Enrich description
      let description = getQuickDescription(rawPartNumber);
      if (description.startsWith('MÓDULO DE AUTOMATIZACIÓN') && !/^[0-9A-Z]{3,}-[0-9A-Z]/.test(rawPartNumber)) {
        description = rawPartNumber;
      }

      // Unique identifier: internalCode or partNumber
      const codeKey = internalCode || `PROD-${rawPartNumber}`;

      const existing = await prisma.product.findUnique({
        where: { internalCode: codeKey },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            partNumber: rawPartNumber,
            description: existing.description && !existing.description.startsWith('REPUESTOS') ? existing.description : description,
            category,
            brand,
            unit,
            currency,
            basePrice: salePrice,
            purchaseCost: purchaseCost,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            internalCode: codeKey,
            partNumber: rawPartNumber,
            description,
            category,
            brand,
            unit,
            currency,
            basePrice: salePrice,
            purchaseCost: purchaseCost,
          },
        });
        imported++;
      }
    }

    return {
      success: true,
      imported,
      updated,
      total: imported + updated,
    };
  } catch (err: unknown) {
    console.error('Error importing Excel products:', err);
    return {
      success: false,
      imported: 0,
      updated: 0,
      total: 0,
      error: err instanceof Error ? err.message : 'Error desconocido al procesar el Excel.',
    };
  }
}

