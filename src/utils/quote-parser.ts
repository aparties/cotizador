// src/utils/quote-parser.ts

export interface ParsedItem {
  id: string;
  partNumber: string;
  quantity: number;
  cost: number;
  condition?: string;
  description?: string;
  hasUserDescription: boolean;
}

const CONDITION_WORDS = new Set([
  'original', 'new', 'brand', 'sealed', 'factory', 'box', 'open', 'used',
  'tested', 'refurbished', 'reacondicionado', 'nuevo', 'usado', 'segunda',
  'mano', 'working', 'good', 'condition', 'oem', 'nib', 'nob', 'fs', 'bn',
  'in', 'a', 'de', 'en', 'con', 'with', 'pcs', 'pc', 'ea', 'unid', 'pza', 'pz', 'cu', 'qty', 'cant'
]);

/**
 * Checks if a string only contains condition or packaging words (e.g. "original new", "brand new")
 * rather than a real product description.
 */
export function isConditionOnly(text: string): boolean {
  if (!text) return true;
  const clean = text
    .toLowerCase()
    .replace(/\b\d+\s*(?:pcs|pc|ea|unid|pza|pz)?\b/gi, ' ')
    .replace(/[^a-záéíóúñ\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ').filter(Boolean);
  if (words.length === 0) return true;
  return words.every((w) => CONDITION_WORDS.has(w));
}

/**
 * Cleans the part number to ensure strictly the pure industrial code is preserved.
 * Eliminates trailing suffixes like "---1PCS", "---2PCS", "x 2", "1pcs", trailing dashes/spaces.
 */
export function cleanPartNumber(raw: string): string {
  let cleaned = raw.trim();
  // Strip trailing quantity / packaging annotations (e.g. ---1pcs, -1pcs, 1ea)
  cleaned = cleaned.replace(/[-_\s]*(?:\d+)?\s*(?:pcs|pc|unid|pza|pz|ea)\b.*$/i, '');
  // Strip trailing triple dashes and anything following (e.g. ---1)
  cleaned = cleaned.replace(/---+.*$/, '');
  // Strip trailing punctuation separators
  cleaned = cleaned.replace(/[-_/\s]+$/, '');
  return cleaned.toUpperCase();
}

export function parseQuickInput(rawText: string): ParsedItem[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedItem[] = [];

  for (const line of lines) {
    // 1. Quantity Detection
    const qtyMatch =
      line.match(/(?:[-|\t,\s]|^)(?:x\s*|qty:\s*|cant:\s*)?(\d+)\s*(?:pcs|pc|unid|pza|pz|ea)\b/i) ||
      line.match(/(?:^|[\t|,])\s*(\d+)\s*(?:[\t|,]|$)/);
    let quantity = 1;
    if (qtyMatch) {
      const q = parseInt(qtyMatch[1], 10);
      if (!isNaN(q) && q > 0) quantity = q;
    }

    // 2. Cost Detection
    const costMatch = line.match(/(?:[\$€]|US\$|USD|S\/\.?|@)?\s*(\d+(?:[.,]\d{1,4}))(?:\s*(?:\/ea|\/pc|ea|c\/u))?/i);
    let cost = 0;
    if (costMatch) {
      const rawNum = costMatch[1].replace(',', '.');
      cost = parseFloat(rawNum);
    }

    // 3. Part Number Detection
    // Matches industrial codes: e.g. 6ES7545-5DA00-0AB0, 1756-L83E, 6SL3244-0BB12-1FA0, etc.
    const tokenMatch = line.match(/([A-Z0-9]{3,}[A-Z0-9\-_./]{2,})/i);
    const rawPart = tokenMatch ? tokenMatch[1] : line.split(/[-,\t|]/)[0];
    const partNumber = cleanPartNumber(rawPart);

    // 4. User Condition Detection
    let condition = 'NUEVO_ORIGINAL';
    if (/used|usado|segunda/i.test(line)) condition = 'USADO_TESTEADO';
    if (/refurb|reacondicionado/i.test(line)) condition = 'REFURBISHED';
    if (/open[\s-]?box/i.test(line)) condition = 'NUEVO_OPEN_BOX';

    // 5. User Description Detection
    // Check if the pasted line contains text outside of the part number, cost, and qty
    let remainder = line;
    if (tokenMatch) remainder = remainder.replace(tokenMatch[1], ' ');
    if (costMatch) remainder = remainder.replace(costMatch[0], ' ');
    
    // Clean noise from remainder
    remainder = remainder
      .replace(/---+/g, ' ')
      .replace(/\b(?:\d+)?\s*(?:pcs|pc|unid|pza|pz|ea)\b/gi, ' ')
      .replace(/[\$€]|US\$|USD|S\/\.?/gi, ' ')
      .replace(/\b(?:x|qty|cant|c\/u|\/ea|\/pc|fob)\b/gi, ' ')
      .replace(/[|,\t\-_/:]+/g, ' ')
      .replace(/\s+\d+\s*$/, '') // strip trailing numbers
      .replace(/\s+/g, ' ')
      .trim();

    // Check if what remains is a genuine textual description or merely a condition/state like "original new"
    const lettersOnly = remainder.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, '');
    const isCondition = isConditionOnly(remainder);
    const hasUserDescription =
      lettersOnly.length >= 4 &&
      !isCondition &&
      !/^repuesto\s+de\s+automatizaci/i.test(remainder) &&
      !/^m[oó]dulo\s+de\s+automatizaci/i.test(remainder);
    const userDescription = hasUserDescription ? remainder : '';

    if (isCondition) {
      if (/used|usado|segunda/i.test(remainder)) condition = 'USADO_TESTEADO';
      if (/refurb|reacondicionado/i.test(remainder)) condition = 'REFURBISHED';
      if (/open[\s-]?box/i.test(remainder)) condition = 'NUEVO_OPEN_BOX';
      if (/original|brand\s*new|new/i.test(remainder)) condition = 'NUEVO_ORIGINAL';
    }

    if (partNumber) {
      results.push({
        id: crypto.randomUUID(),
        partNumber,
        quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
        cost: isNaN(cost) ? 0 : cost,
        condition,
        description: userDescription,
        hasUserDescription,
      });
    }
  }

  return results;
}
