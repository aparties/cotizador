// src/utils/quote-parser.ts
export interface ParsedItem {
  id: string;
  partNumber: string;
  quantity: number;
  cost: number;
  condition?: string;
  description?: string;
}

export function parseQuickInput(rawText: string): ParsedItem[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedItem[] = [];

  for (const line of lines) {
    const qtyMatch =
      line.match(/(?:[-|\t,\s]|^)(?:x\s*|qty:\s*)?(\d+)\s*(?:pcs|pc|unid|pza|pz|ea)?(?:[-|\t,\s]|$)/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    const costMatch = line.match(/(?:[\$€]|US\$|USD|S\/\.?|@)?\s*(\d+(?:[.,]\d{1,4}))(?:\s*(?:\/ea|\/pc|ea|c\/u))?/i);
    let cost = 0;
    if (costMatch) {
      const rawNum = costMatch[1].replace(',', '.');
      cost = parseFloat(rawNum);
    }

    let cleanLine = line;
    if (costMatch) cleanLine = cleanLine.replace(costMatch[0], '');
    
    const tokenMatch = cleanLine.match(/([A-Z0-9]{3,}[A-Z0-9\-_./]{2,})/i);
    const partNumber = tokenMatch ? tokenMatch[1].trim() : cleanLine.split(/[-,\t]/)[0].trim();

    let condition = 'NUEVO_ORIGINAL';
    if (/used|usado|segunda/i.test(line)) condition = 'USADO_TESTEADO';
    if (/refurb|reacondicionado/i.test(line)) condition = 'REFURBISHED';
    if (/open[\s-]?box/i.test(line)) condition = 'NUEVO_OPEN_BOX';

    if (partNumber) {
      results.push({
        id: crypto.randomUUID(),
        partNumber: partNumber.toUpperCase(),
        quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
        cost: isNaN(cost) ? 0 : cost,
        condition,
        description: `Repuesto de automatización industrial mod. ${partNumber}`,
      });
    }
  }

  return results;
}

