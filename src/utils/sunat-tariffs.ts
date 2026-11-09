// src/utils/sunat-tariffs.ts

export interface SunatTariffClassification {
  hsCode: string;          // Subpartida Nacional de 10 dígitos (ej. 8537.10.90.00)
  adValoremRate: number;   // 0, 6 o 11
  category: string;        // Categoría arancelaria
  description: string;     // Descripción técnica oficial SUNAT
}

/**
 * Catálogo inteligente de Subpartidas Nacionales SUNAT para Repuestos y Equipos Industriales
 * Basado en el Arancel de Aduanas del Perú (D.S. N° 404-2021-EF y acuerdos comerciales de desgravación).
 */
export function classifySunatTariff(partNumber: string, description: string = ''): SunatTariffClassification {
  const code = (partNumber || '').toUpperCase().replace(/[\s\-_]/g, '');
  const desc = (description || '').toUpperCase();

  // 1. Cables industriales, buses de comunicación con conectores (6XV, PROFINET, PROFIBUS)
  if (
    code.startsWith('6XV') ||
    desc.includes('CABLE') ||
    desc.includes('CONDUCTOR')
  ) {
    return {
      hsCode: '8544.49.10.00',
      adValoremRate: 6,
      category: 'CABLES Y CONDUCTORES',
      description: 'Conductores eléctricos provistos de piezas de conexión para tensión <= 1,000 V',
    };
  }

  // 2. Interruptores, pulsadores, llaves de mando, selectores, bornes (3SB, 800T, etc.)
  if (
    code.startsWith('3SB') ||
    code.startsWith('800T') ||
    desc.includes('PULSADOR') ||
    desc.includes('INTERRUPTOR') ||
    desc.includes('SELECTOR') ||
    desc.includes('LLAVE TERM') ||
    desc.includes('BORNA') ||
    desc.includes('TOMACORRIENTE')
  ) {
    return {
      hsCode: '8536.50.90.00',
      adValoremRate: 6,
      category: 'CONMUTADORES Y MANDOS',
      description: 'Aparatos para corte, seccionamiento y conexión de circuitos eléctricos',
    };
  }

  // 3. Contactores, relés de sobrecarga, guardamotores (Siemens SIRIUS 3RT, 3RU, 3RV, 3RB)
  if (
    code.startsWith('3RT') ||
    code.startsWith('3RU') ||
    code.startsWith('3RV') ||
    code.startsWith('3RB') ||
    desc.includes('CONTACTOR') ||
    desc.includes('GUARDAMOTOR') ||
    desc.includes('RELÉ') ||
    desc.includes('RELE')
  ) {
    return {
      hsCode: '8536.49.10.00',
      adValoremRate: 0,
      category: 'CONTACTORES Y RELÉS',
      description: 'Relés y contactores de potencia para tensión <= 1,000 V',
    };
  }

  // 4. Variadores de Frecuencia / Drives / Inversores (Siemens SINAMICS 6SL3, Rockwell PowerFlex 20G/20F, Schneider ATV)
  if (
    code.startsWith('6SL3') ||
    code.startsWith('6SL3210') ||
    code.startsWith('6SL3224') ||
    code.startsWith('6SL3244') ||
    code.startsWith('6SL3211') ||
    code.startsWith('20G') ||
    code.startsWith('20F') ||
    code.startsWith('ATV') ||
    desc.includes('VARIADOR') ||
    desc.includes('INVERSOR') ||
    desc.includes('DRIVE') ||
    desc.includes('SINAMICS') ||
    desc.includes('POWERFLEX')
  ) {
    return {
      hsCode: '8504.40.90.00',
      adValoremRate: 0,
      category: 'VARIADORES DE FRECUENCIA',
      description: 'Convertidores estáticos de velocidad variable para motores eléctricos',
    };
  }

  // 5. Fuentes de Alimentación Estabilizadas (Siemens SITOP 6EP, Allen-Bradley 1606)
  if (
    code.startsWith('6EP') ||
    code.startsWith('1606') ||
    desc.includes('FUENTE') ||
    desc.includes('SITOP') ||
    desc.includes('POWER SUPPLY')
  ) {
    return {
      hsCode: '8504.40.10.00',
      adValoremRate: 0,
      category: 'FUENTES DE PODER',
      description: 'Fuentes de alimentación estabilizadas 24V DC industriales',
    };
  }

  // 6. Pantallas HMI / Paneles Táctiles Industriales (Siemens SIMATIC 6AV2, 6AV6, PanelView 2711)
  if (
    code.startsWith('6AV2') ||
    code.startsWith('6AV6') ||
    code.startsWith('2711') ||
    desc.includes('HMI') ||
    desc.includes('PANEL') ||
    desc.includes('PANTALLA') ||
    desc.includes('TOUCH')
  ) {
    return {
      hsCode: '8528.52.00.00',
      adValoremRate: 0,
      category: 'PANELES HMI',
      description: 'Aparatos de visualización para máquinas de tratamiento o proceso automatizado',
    };
  }

  // 7. Sensores e instrumentos de medida (IFM, Autonics, encoders, inductivos, presión)
  if (
    desc.includes('SENSOR') ||
    desc.includes('TRANSMISOR') ||
    desc.includes('ENCODER') ||
    desc.includes('TERMODUPLA') ||
    desc.includes('TERMOCUPLA') ||
    desc.includes('CELDA DE CARGA') ||
    desc.includes('VALVULA') ||
    desc.includes('ACTUADOR')
  ) {
    return {
      hsCode: '9031.80.00.00',
      adValoremRate: 0,
      category: 'INSTRUMENTACIÓN Y SENSORES',
      description: 'Instrumentos, aparatos y máquinas de medida o control automático',
    };
  }

  // 8. PLCs, CPUs, Módulos E/S, Conectores de Bus (ET 200SP, S7-1500, S7-1200, S7-300, ControlLogix, CompactLogix, Point I/O)
  // Partida estándar reina de automatización en Perú: 8537.10.90.00 (Ad-Valorem 0%)
  return {
    hsCode: '8537.10.90.00',
    adValoremRate: 0,
    category: 'AUTÓMATAS Y CONTROLADORES PLC',
    description: 'Cuadros, paneles y soportes para control eléctrico / autómatas programables',
  };
}
