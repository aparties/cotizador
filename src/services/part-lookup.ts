// src/services/part-lookup.ts
import { prisma } from '@/lib/db';
import { CURATED_PARTS, decodeByIndustrialRules } from '@/utils/industrial-catalog';

/**
 * Searches the web for the part number to extract its real technical description
 */
async function searchWebForPart(partNumber: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // Max 3s timeout

    const query = `${partNumber} "Siemens" OR "SIMATIC" OR "Allen-Bradley" OR "SINAMICS"`;
    const res = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();

    // Look for snippets containing product description keywords
    const blockMatches = Array.from(html.matchAll(/<div class="compText[^>]*>([\s\S]*?)<\/div>/g));
    const blocks = blockMatches.map((m) => m[1].replace(/<[^>]+>/g, '').trim());

    for (const block of blocks) {
      if (
        /simatic|sinamics|módulo|module|unidad|control|input|output|communication|comunicación|controller/i.test(block) &&
        !/warranty|obsolete parts|in stock|buy online|rfq/i.test(block.slice(0, 40))
      ) {
        // Truncate cleanly at first or second sentence
        const sentences = block.split(/(?<=[.!?])\s+/);
        let desc = sentences[0];
        if (desc.length < 50 && sentences.length > 1) {
          desc += ' ' + sentences[1];
        }
        if (desc.length > 130) {
          desc = desc.slice(0, 127).trim() + '...';
        }
        return desc.toUpperCase();
      }
    }

    // Check titles
    const titleMatches = Array.from(html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g));
    const titles = titleMatches.map((m) => m[1].replace(/<[^>]+>/g, '').trim());

    for (const title of titles) {
      if (/simatic|sinamics|module|módulo|unit|control unit/i.test(title) && !/ships|warranty|buy/i.test(title)) {
        return title.replace(/[-|].*$/, '').trim().toUpperCase();
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Main function: Resolves the exact technical module description
 * 1. Checks Curated Dictionary (0ms)
 * 2. Checks Database `Product` table
 * 3. Tries Web Search
 * 4. Falls back to MLFB / Industrial Rule Decoder
 * 5. Clean fallback
 */
export async function resolvePartDescription(partNumber: string): Promise<string> {
  const cleanCode = partNumber.trim().toUpperCase();
  if (!cleanCode) return '';

  // 1. Direct Curated match
  if (CURATED_PARTS[cleanCode]) {
    return CURATED_PARTS[cleanCode];
  }

  // 2. Database Product match
  try {
    const dbProduct = await prisma.product.findFirst({
      where: { partNumber: cleanCode }
    });
    if (dbProduct && dbProduct.category && dbProduct.category !== 'REPUESTOS' && dbProduct.category !== 'REPUESTOS ELECTRICOS') {
      return `${dbProduct.brand ? dbProduct.brand + ' - ' : ''}${dbProduct.category}`;
    }
  } catch {
    // DB might be temporarily unreachable or table empty
  }

  // 3. Try Web Search
  const webDesc = await searchWebForPart(cleanCode);
  if (webDesc) {
    return webDesc;
  }

  // 4. Rule-based industrial decoder
  const ruleDesc = decodeByIndustrialRules(cleanCode);
  if (ruleDesc) {
    return ruleDesc;
  }

  // 5. Clean fallback (without trailing artifacts)
  return `MÓDULO DE AUTOMATIZACIÓN INDUSTRIAL ${cleanCode}`;
}
