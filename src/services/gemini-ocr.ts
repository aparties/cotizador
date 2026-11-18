'use server';

import { generatePartCode } from '@/utils/code-generator';

export interface ExtractedImageItem {
  code: string;
  description: string;
  quantity: number;
  originalPrice: number;
  detectedCurrency: 'PEN' | 'USD';
  priceUsd: number;
  rawLine: string;
  formattedLine: string;
}

export interface ImageExtractionResult {
  success: boolean;
  items: ExtractedImageItem[];
  detectedCurrency?: 'PEN' | 'USD';
  rawTextExtracted?: string;
  formattedText?: string;
  rawFormattedText?: string;
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
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for vision

    const prompt = `Analiza detalladamente esta imagen de cotización, lista de precios o proforma industrial.
Extrae TODOS los repuestos, productos, materiales o ítems listados en la tabla con sus datos literales EXACTOS sin alterar los números:

Para cada ítem extrae:
- "description": Descripción técnica completa del producto en MAYÚSCULAS (omite el número de ítem inicial y guiones de viñeta).
- "partNumber": Si el producto tiene un número de parte o código de fabricante explícito (ej. XCKJ10541H29C, 6ES7..., 1756...), extráelo. Si no tiene código explícito, déjalo como string vacío "".
- "unit": Unidad de medida (ej. UN, RLL, MTR, PCS, PZ).
- "quantity": Cantidad numérica entera o decimal (ej. 2, 1, 4...).
- "unitPrice": El número EXACTO que aparece escrito en la columna PRECIO unitario, tal cual, sin hacer ningún cálculo matemático ni división (ej. 40.00, 310.00, 8.00, 150.00). Si no tiene precio visible, pon 0.
- "totalPrice": El número EXACTO en la columna TOTAL sin hacer ningún cálculo (ej. 80.00, 310.00, 32.00...).

Detección de Moneda:
- "detectedCurrency": Si en el encabezado o tabla de la imagen se observa "S/", "SOLES" o "S/." pon "PEN". Si se observa "$", "USD" o "DOLARES" pon "USD". Si no hay símbolo explícito de moneda en la tabla, pon "UNKNOWN".

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "detectedCurrency": "PEN" | "USD" | "UNKNOWN",
  "items": [
    {
      "description": "CAJA DE PASO ALUMINIO PESADO 10X10X4MM",
      "partNumber": "",
      "unit": "UN",
      "quantity": 2,
      "unitPrice": 40.00,
      "totalPrice": 80.00
    }
  ],
  "rawTextExtracted": "Resumen del texto visible..."
}`;

    // Available Gemini Vision models
    const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
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
                temperature: 0.0,
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
            interface RawVisionItem {
              description?: string;
              partNumber?: string;
              unit?: string;
              quantity?: number | string;
              unitPrice?: number | string;
              totalPrice?: number | string;
            }

            const parsed = JSON.parse(jsonText);
            const rawList: RawVisionItem[] = parsed.items || [];

            const detectedCurr: 'PEN' | 'USD' =
              parsed.detectedCurrency === 'USD'
                ? 'USD'
                : parsed.detectedCurrency === 'PEN'
                ? 'PEN'
                : currency;

            const isSoles = detectedCurr === 'PEN';
            const rate = exchangeRate > 0 ? exchangeRate : 3.765;

            const items: ExtractedImageItem[] = rawList.map((rawIt) => {
              const desc = String(rawIt.description || '').trim();
              const explicitCode = String(rawIt.partNumber || '').trim();
              const code = generatePartCode(desc, explicitCode);

              const quantity =
                typeof rawIt.quantity === 'number'
                  ? rawIt.quantity
                  : parseFloat(String(rawIt.quantity)) || 1;

              const originalPrice =
                typeof rawIt.unitPrice === 'number'
                  ? rawIt.unitPrice
                  : parseFloat(String(rawIt.unitPrice).replace(/[^0-9.]/g, '')) || 0;

              // Strictly deterministic math in TypeScript
              const priceUsd = isSoles
                ? Number((originalPrice / rate).toFixed(4))
                : Number(originalPrice.toFixed(4));

              const formattedLine = `${code} - ${desc} - ${quantity}pcs - ${priceUsd}`;
              const rawLine = `${code} - ${desc} - ${quantity}pcs - ${originalPrice}`;

              return {
                code,
                description: desc,
                quantity,
                originalPrice,
                detectedCurrency: detectedCurr,
                priceUsd,
                rawLine,
                formattedLine,
              };
            });

            const formattedText = items.map((it) => it.formattedLine).join('\n');
            const rawFormattedText = items.map((it) => it.rawLine).join('\n');

            return {
              success: true,
              items,
              detectedCurrency: detectedCurr,
              rawTextExtracted: parsed.rawTextExtracted || '',
              formattedText,
              rawFormattedText,
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
