'use server';

export interface ExtractedImageItem {
  code: string;
  description: string;
  quantity: number;
  originalPrice: number;
  detectedCurrency: 'PEN' | 'USD';
  priceUsd: number;
  formattedLine: string;
}

export interface ImageExtractionResult {
  success: boolean;
  items: ExtractedImageItem[];
  rawTextExtracted?: string;
  formattedText?: string;
  error?: string;
}

export async function extractQuoteFromImage(
  imageBase64: string,
  mimeType: string = 'image/png',
  currency: 'PEN' | 'USD' = 'PEN',
  exchangeRate: number = 3.765
): Promise<ImageExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      items: [],
      error: 'GEMINI_API_KEY no está configurada en las variables de entorno.',
    };
  }

  // Strip data URL header if present (e.g. data:image/png;base64,...)
  let cleanBase64 = imageBase64;
  if (cleanBase64.includes('base64,')) {
    cleanBase64 = cleanBase64.split('base64,')[1];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout for vision

    const prompt = `Eres un ingeniero especialista en cotizaciones industriales, repuestos y extracción de datos en Perú.
Analiza cuidadosamente esta imagen (puede ser una cotización de proveedor, lista de WhatsApp, factura, proforma o captura de pantalla) y extrae TODOS los repuestos, productos o materiales listados.

Parámetros:
- Tipo de Cambio (T.C.): S/ ${exchangeRate} por cada 1 USD.
- Moneda sugerida por usuario: ${currency}.

Para CADA ítem encontrado en la imagen extrae:
1. "code": Si la imagen tiene un número de parte o código de fabricante (ej. XCKJ10541H29C, 6ES7..., 1756...), úsalo. Si no tiene código explícito, genera un código mnemotécnico corto en mayúsculas sin espacios (ej. CAJAALU10X10, LTCONREC12, LTCONCUR12, CABGPT18).
2. "description": La descripción técnica del repuesto en MAYÚSCULAS.
3. "quantity": Cantidad numérica entera. Si no se indica, asume 1.
4. "originalPrice": El precio unitario numérico tal cual aparece en la imagen. Si no tiene precio, pon 0.
5. "detectedCurrency": "PEN" (si está en Soles / S/) o "USD" (si está en Dólares / $).
6. "priceUsd": El precio unitario final en DÓLARES (USD). Si la moneda detectada o indicada es Soles (PEN), divide el precio original entre ${exchangeRate} y redondea a 4 decimales (ej. 22.95 / 3.765 = 6.0964). Si ya está en dólares, conserva el valor.
7. "formattedLine": La línea con el formato EXACTO:
   "<code > - <description> - <quantity>pcs - <priceUsd>"

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "items": [
    {
      "code": "CAJAALU10X10",
      "description": "CAJA DE PASO ALUMINIO PESADO 10X10X4MM",
      "quantity": 2,
      "originalPrice": 22.9529,
      "detectedCurrency": "PEN",
      "priceUsd": 6.0964,
      "formattedLine": "CAJAALU10X10 - CAJA DE PASO ALUMINIO PESADO 10X10X4MM - 2pcs - 6.0964"
    }
  ],
  "rawTextExtracted": "Texto legible que lograste leer de la imagen..."
}`;

    // Use fast vision models with fallback
    const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let lastError = '';

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
            signal: controller.signal,
          }
        );

        if (res.ok) {
          clearTimeout(timeout);
          const data = await res.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            const items: ExtractedImageItem[] = parsed.items || [];
            const formattedText = items.map((it) => it.formattedLine).join('\n');
            return {
              success: true,
              items,
              rawTextExtracted: parsed.rawTextExtracted || '',
              formattedText,
            };
          }
        } else {
          lastError = `Modelo ${model} retornó status ${res.status}`;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    clearTimeout(timeout);
    return {
      success: false,
      items: [],
      error: `No se pudo procesar la imagen con Gemini Vision: ${lastError}`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      items: [],
      error: err instanceof Error ? err.message : 'Error al procesar la imagen.',
    };
  }
}
