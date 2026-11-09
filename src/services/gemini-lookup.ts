// src/services/gemini-lookup.ts

/**
 * Resolves industrial part descriptions using Google Gemini API in batch
 */
export async function lookupPartsWithGemini(
  partNumbers: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || partNumbers.length === 0) {
    return result;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const prompt = `Eres un ingeniero especialista en automatización industrial (Siemens, Rockwell Allen-Bradley, Schneider Electric, Omron, ABB, etc.).
Para cada uno de los siguientes códigos de parte de repuestos industriales, proporciona su DESCRIPCIÓN TÉCNICA OFICIAL EN ESPAÑOL en MAYÚSCULAS, precisa y profesional (ejemplo: "SIMATIC ET 200SP, MÓDULO DE COMUNICACIÓN CM PROFIBUS DP" o "SINAMICS G120, UNIDAD DE CONTROL CU240E-2").

Códigos a identificar:
${partNumbers.join('\n')}

Responde ÚNICAMENTE con un JSON válido mapeando cada código con su descripción. Formato:
{
  "CODIGO": "DESCRIPCION TECNICA"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('Gemini API returned error status:', res.status);
      return result;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      for (const [code, desc] of Object.entries(parsed)) {
        if (typeof desc === 'string' && desc.trim()) {
          result.set(code.trim().toUpperCase(), desc.trim().toUpperCase());
        }
      }
    }
  } catch (err) {
    console.warn('Gemini lookup error (falling back to local catalog):', err);
  }

  return result;
}

