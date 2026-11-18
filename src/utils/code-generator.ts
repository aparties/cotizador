// src/utils/code-generator.ts

export interface GeneratedCodeItem {
  code: string;
  description: string;
  quantity: number;
  originalPrice: number;
  priceWithoutIgv: number;
  convertedPriceUsd: number;
  formattedLine: string;
}

/**
 * Intelligent Code / SKU generator from description or raw text
 */
export function generatePartCode(description: string, existingCode?: string): string {
  if (existingCode && existingCode.trim()) {
    const clean = existingCode.trim().toUpperCase().replace(/[^A-Z0-9\-_./]/g, '');
    if (clean.length >= 3) return clean;
  }

  const desc = description.trim().toUpperCase();

  // 1. Check if description has an embedded manufacturer part code (e.g., XCKJ10541H29C, 6ES7..., 1756...)
  const modelMatch =
    desc.match(/\b([A-Z]{2,}[0-9][A-Z0-9\-_./]{3,})\b/i) ||
    desc.match(/\b([0-9]{3,}[A-Z][A-Z0-9\-_./]{3,})\b/i);
  if (modelMatch) {
    const candidate = modelMatch[1].replace(/[^A-Z0-9\-_]/g, '');
    const forbidden = ['PIEZAS', 'UNIDADES', 'METROS', 'ROLLO', 'CAJAS', 'ALUMINIO', 'TELEMECANIQUE'];
    if (!forbidden.includes(candidate)) {
      return candidate;
    }
  }

  // 2. Specific industrial hardware patterns
  // Liquid Tight Connectors (e.g. CONECTOR RECTO LIQUID TIGHT 1/2" or vendor typo LIQUIT THIGH)
  if (
    desc.includes('LIQUID TIGHT') ||
    desc.includes('LIQUIDTIGHT') ||
    desc.includes('LIQUIT') ||
    desc.includes('THIGH') ||
    desc.includes('LT ')
  ) {
    let type = 'CON';
    if (desc.includes('RECTO') || desc.includes('REC')) type = 'CONREC';
    else if (desc.includes('CURVO') || desc.includes('CUR')) type = 'CONCUR';

    let size = '12';
    if (desc.includes('1/2') || desc.includes('1/2"')) size = '12';
    else if (desc.includes('3/4') || desc.includes('3/4"')) size = '34';
    else if (desc.includes('1"') || desc.includes(' 1 ') || desc.includes('1 PULG')) size = '100';
    else if (desc.includes('3/8') || desc.includes('3/8"')) size = '38';
    else if (desc.includes('1-1/4') || desc.includes('1 1/4')) size = '114';
    else if (desc.includes('1-1/2') || desc.includes('1 1/2')) size = '112';
    else if (desc.includes('2"') || desc.includes(' 2 ')) size = '200';

    return `LT${type}${size}`.toUpperCase();
  }

  // Cables (e.g. CABLE GPT #18AWG)
  if (desc.includes('CABLE') || desc.includes('CAB ')) {
    let sub = 'CAB';
    if (desc.includes('GPT')) sub += 'GPT';
    else if (desc.includes('THW') || desc.includes('TW')) sub += 'THW';
    else if (desc.includes('VULCANIZADO')) sub += 'VULC';
    else if (desc.includes('APANTALLADO') || desc.includes('STP')) sub += 'STP';
    else if (desc.includes('PROFIBUS')) sub += 'PROF';
    else if (desc.includes('PROFINET')) sub += 'PNET';

    const awgMatch = desc.match(/#?(\d+)\s*(?:AWG|MM)?/i);
    if (awgMatch) sub += awgMatch[1];
    return sub.toUpperCase();
  }

  // Cajas de paso / Enclosures (e.g. CAJA DE PASO ALUMINIO PESADO 10X10X4MM)
  if (desc.includes('CAJA') || desc.includes('GABINETE') || desc.includes('TABLERO')) {
    let prefix = 'CAJA';
    if (desc.includes('ALUMINIO') || desc.includes('ALU')) prefix += 'ALU';
    else if (desc.includes('FIBRA')) prefix += 'FIB';
    else if (desc.includes('FIERRO') || desc.includes('F°G°') || desc.includes('GALVANIZADO')) prefix += 'FG';
    else if (desc.includes('PLASTICO') || desc.includes('PVC')) prefix += 'PVC';

    const dimMatch = desc.match(/(\d+)\s*X\s*(\d+)(?:\s*X\s*\d+)?/i);
    if (dimMatch) {
      prefix += `${dimMatch[1]}X${dimMatch[2]}`;
    }
    return prefix.toUpperCase();
  }

  // Final de carrera / Limit Switch (e.g. FINAL DE CARRERA CON ROLDANA TELEMECANIQUE)
  if (desc.includes('FINAL DE CARRERA') || desc.includes('LIMIT SWITCH') || desc.includes('FIN DE CARRERA')) {
    const codeMatch = desc.match(/\b([A-Z]{3,}\d+[A-Z0-9]*)\b/i);
    if (codeMatch) return codeMatch[1].toUpperCase();
    return 'FDC' + desc.slice(0, 7).replace(/[^A-Z0-9]/g, '');
  }

  // 3. General intelligent acronym fallback
  const stopWords = new Set([
    'DE', 'DEL', 'PARA', 'CON', 'EN', 'POR', 'UN', 'UNA', 'LOS', 'LAS', 'TIPO',
    'MM', 'PZA', 'UNID', 'PCS', 'PZ', 'PC', 'C/U', 'CANT', 'QTY', 'SIN', 'CON'
  ]);
  const words = desc
    .replace(/[^\w\s/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  if (words.length === 0) return 'ITEM' + Math.floor(1000 + Math.random() * 9000);

  let generated = '';
  for (let i = 0; i < Math.min(words.length, 3); i++) {
    const w = words[i];
    if (/^\d+$/.test(w)) {
      generated += w;
    } else {
      generated += w.slice(0, 3);
    }
  }

  const nums = desc.match(/\d+/g);
  if (nums && !generated.match(/\d/)) {
    generated += nums[0];
  }

  return generated.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
}

/**
 * Parses raw messy lines or Excel tab copies and converts them into normalized items
 * with USD prices and generated codes
 */
export function processRawQuoteToQuickPaste(
  rawText: string,
  currency: 'PEN' | 'USD',
  exchangeRate: number,
  deductIgv: boolean = true
): GeneratedCodeItem[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: GeneratedCodeItem[] = [];

  for (const line of lines) {
    let quantity = 1;
    let originalPrice = 0;
    let extractedCode = '';
    let description = '';

    // Check if line is from Excel (tab-separated)
    if (line.includes('\t')) {
      const cells = line.split('\t').map((c) => c.trim()).filter(Boolean);
      
      for (const cell of cells) {
        // Price detection
        if (!originalPrice && /(?:[\$€]|US\$|USD|S\/\.?|S\/)?\s*\d+(?:[.,]\d{1,4})/i.test(cell)) {
          const pMatch = cell.match(/(?:[\$€]|US\$|USD|S\/\.?|S\/)?\s*(\d+(?:[.,]\d{1,4}))/i);
          if (pMatch) {
            originalPrice = parseFloat(pMatch[1].replace(',', '.'));
            continue;
          }
        }

        // Quantity detection (pure integer <= 5000 or e.g. "2pcs")
        if (quantity === 1 && (/^\d+\s*(?:pcs|pc|unid|pza|pz|ea)?$/i.test(cell) || /^x\s*\d+$/i.test(cell))) {
          const qMatch = cell.match(/\d+/);
          if (qMatch) {
            const q = parseInt(qMatch[0], 10);
            if (q > 0) {
              quantity = q;
              continue;
            }
          }
        }

        // Code detection (short alphanumeric, no spaces, starts with letter/digit)
        if (!extractedCode && /^[A-Z0-9\-_./]{3,20}$/i.test(cell) && !/^(?:UNIDADES|PIEZAS|METROS|SOLES|DOLARES)$/i.test(cell)) {
          extractedCode = cell;
          continue;
        }

        // Otherwise treat as part of description
        if (cell.length > 2) {
          description = description ? `${description} ${cell}` : cell;
        }
      }
    } else {
      // 1. Extract Quantity: e.g. "2pcs", "1 pcs", "4", "qty: 2"
      const qtyMatch =
        line.match(/(?:[-|\t,\s]|^)(?:x\s*|qty:\s*|cant:\s*)?(\d+)\s*(?:pcs|pc|unid|pza|pz|ea)\b/i) ||
        line.match(/(?:[-|\t,;])\s*(\d+)\s*(?:[-|\t,;]|$)/);
      if (qtyMatch) {
        const q = parseInt(qtyMatch[1], 10);
        if (!isNaN(q) && q > 0) quantity = q;
      }

      // 2. Extract Price (admite enteros como 40, 310, 8 y decimales como 40.00, 6.0964)
      const priceMatch =
        line.match(/(?:[\$€]|US\$|USD|S\/\.?|S\/)\s*(\d+(?:[.,]\d+)?)/i) ||
        line.match(/[-|\t,;:]\s*(\d+(?:[.,]\d+)?)\s*$/) ||
        line.match(/\b(\d+[.,]\d+)\b/);
      if (priceMatch) {
        const numStr = priceMatch[1].replace(',', '.');
        const val = parseFloat(numStr);
        if (!isNaN(val)) originalPrice = val;
      }

      // 3. Clean line to extract Description & Code
      let cleanLine = line;
      if (priceMatch) cleanLine = cleanLine.replace(priceMatch[0], ' ');
      if (qtyMatch) cleanLine = cleanLine.replace(qtyMatch[0], ' ');

      const dashParts = cleanLine.split(/\s*-\s*|\s*:\s*|\s*\|\s*/).map((p) => p.trim()).filter(Boolean);

      if (dashParts.length >= 2) {
        const p0 = dashParts[0].trim();
        const p1 = dashParts.slice(1).join(' - ').trim();
        if (p0.split(/\s+/).length <= 2 && /^[A-Z0-9\-_./]+$/i.test(p0)) {
          extractedCode = p0;
          description = p1;
        } else {
          description = cleanLine;
        }
      } else {
        description = cleanLine;
      }
    }

    // Descontar IGV 18% si deductIgv está activo (dividir entre 1.18 para obtener el costo neto contable)
    const basePriceNet = deductIgv && originalPrice > 0 ? originalPrice / 1.18 : originalPrice;
    const priceWithoutIgv = Number(basePriceNet.toFixed(4));

    // Check if line explicitly specifies S/ or USD regardless of global setting
    const lineIsSoles = /S\/\.?\s*\d/i.test(line) || currency === 'PEN';
    const convertedPriceUsd = lineIsSoles
      ? exchangeRate > 0
        ? Number((basePriceNet / exchangeRate).toFixed(4))
        : basePriceNet
      : Number(basePriceNet.toFixed(4));

    // Clean description of noise
    description = description
      .replace(/\b(?:pcs|pc|unid|pza|pz|ea|cant|qty|c\/u)\b/gi, '')
      .replace(/S\/\.?|USD|US\$|\$/gi, '')
      .replace(/[-|;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If description starts with extractedCode, strip it to prevent duplicate (ej. XCKJ... - XCKJ...)
    if (extractedCode) {
      const esc = extractedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      description = description.replace(new RegExp(`^${esc}\\s*[-:]*\\s*`, 'i'), '').trim();
    }

    // Generate or refine Code
    const code = generatePartCode(description, extractedCode);

    // If description repeats the code at the end or start, clean it
    if (code && description.toUpperCase().includes(code)) {
      description = description.replace(new RegExp(`\\b${code}\\b`, 'gi'), '').trim();
    }

    if (!description) {
      description = `ITEM INDUSTRIAL ${quantity}PCS`;
    }

    // Format strictly as requested:
    // CAJAALU10X10 - CAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - 6.0964
    const formattedLine = `${code} - ${description.toUpperCase()} - ${quantity}pcs - ${convertedPriceUsd}`;

    results.push({
      code,
      description: description.toUpperCase(),
      quantity,
      originalPrice,
      priceWithoutIgv,
      convertedPriceUsd,
      formattedLine,
    });
  }

  return results;
}
