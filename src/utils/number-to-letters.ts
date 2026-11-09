// src/utils/number-to-letters.ts
function unidades(num: number): string {
  const u = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  return u[num] || '';
}

function decenas(num: number): string {
  const d = [
    '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
    'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
  ];
  const especiales: Record<number, string> = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE',
  };

  if (especiales[num]) return especiales[num];
  const dec = Math.floor(num / 10);
  const uni = num % 10;
  if (dec === 0) return unidades(uni);
  if (uni === 0) return d[dec];
  return `${d[dec]} Y ${unidades(uni)}`;
}

function centenas(num: number): string {
  if (num === 100) return 'CIEN';
  const c = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
    'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
  ];
  const cen = Math.floor(num / 100);
  const resto = num % 100;
  return cen === 0 ? decenas(resto) : `${c[cen]} ${decenas(resto)}`.trim();
}

function seccion(num: number, divisor: number, strSingular: string, strPlural: string): string {
  const cientos = Math.floor(num / divisor);
  const resto = num - cientos * divisor;
  let letras = '';
  if (cientos > 0) {
    if (cientos > 1) letras = `${centenas(cientos)} ${strPlural}`;
    else letras = strSingular;
  }
  if (resto > 0) letras = `${letras} ${centenas(resto)}`.trim();
  return letras;
}

export function numberToLetters(amount: number, currency = 'DOLARES AMERICANOS'): string {
  const cleanAmount = Math.abs(amount || 0);
  const entero = Math.floor(cleanAmount);
  const centavos = Math.round((cleanAmount - entero) * 100);
  const centavosStr = centavos.toString().padStart(2, '0');

  let letrasEntero = '';
  if (entero === 0) {
    letrasEntero = 'CERO';
  } else if (entero < 1000) {
    letrasEntero = centenas(entero);
  } else if (entero < 1000000) {
    const miles = Math.floor(entero / 1000);
    const resto = entero % 1000;
    const milesStr = miles === 1 ? 'MIL' : `${centenas(miles)} MIL`;
    letrasEntero = resto > 0 ? `${milesStr} ${centenas(resto)}` : milesStr;
  } else {
    letrasEntero = seccion(entero, 1000000, 'UN MILLÓN', 'MILLONES');
  }

  return `SON ${letrasEntero.trim()} Y ${centavosStr}/100 ${currency.toUpperCase()}`;
}

