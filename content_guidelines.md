# 📋 Content Guidelines - QuickQuote Industrial

Guía de estilo de contenidos, terminología técnica, normas tributarias peruanas y convenciones de datos para Bicode Control S.A.C.

---

## 1. Convenciones de Nomenclatura Industrial

### Part Numbers (Códigos de Fabricante)
- **Siemens**: Conservar guiones y mayúsculas completas (ej. `6ES7131-6BF01-0AA0`, `6ES7545-5DA00-0AB0`).
- **Allen-Bradley**: Respetar prefijos de familia y guiones (ej. `1756-L83E`, `2080-LC50-24QBB`).
- **Schneider Electric**: Códigos alfanuméricos continuos (ej. `ATV320U15N4B`, `TM221CE40T`).
- **Omron**: Códigos con guión y sufijo (ej. `CJ2M-CPU31`, `E3Z-D61`).

### Unidades de Medida Permitidas
- `UNIDADES` (Default en automatización y repuestos).
- `PZA` / `PIEZAS`.
- `KIT` (Conjuntos armados).
- `METROS` (Cables de comunicación Profibus/Profinet).

---

## 2. Reglas de Liquidación Aduanera y Tributaria (Perú / SUNAT)

### Términos de Comercio Internacional (Incoterms)
- **FOB (Free on Board)**: Costo unitario neto del repuesto en origen (proveedor extranjero en USD).
- **CFR (Cost and Freight)**: FOB + Flete internacional prorrateado.
- **Seguro de Tabla SUNAT**: 0.75% sobre valor CFR (Resolución de Intendencia Nacional de Aduanas para repuestos de las partidas 84 y 85).
- **CIF (Cost, Insurance and Freight)**: CFR + Seguro = Base imponible para tributos aduaneros.

### Aranceles (Ad Valorem)
- **0%**: Partidas preferenciales de automatización, PLCs y controladores programables (Partida Arancelaria `8537.10.90.00`).
- **6% u 11%**: Partidas residuales de cables, gabinetes o motores según procedencia sin TLC.
- *Regla Contable*: El Ad Valorem **no es deducible** como crédito fiscal y se incorpora directamente al **Costo Landed**.

### Impuestos y Crédito Fiscal
- **I.G.V. Aduanero (18%)**: Se paga en aduana pero constituye crédito fiscal para Bicode Control. No forma parte del costo landed contable, pero impacta en el flujo de caja inicial.
- **Percepción del IGV (3.5%)**: Aplicable a importadores frecuentes con DUA (3.5% sobre CIF + Ad Valorem + IGV). Se recupera contra ventas internas.

---

## 3. Estándar de Glosa y Letras en Proformas
- Toda proforma emitida debe incluir obligatoriamente el importe total en letras en mayúsculas:
  - Formato: `SON [IMPORTE EN LETRAS] Y [CENTAVOS]/100 DOLARES AMERICANOS`
  - Ejemplo: `SON SIETE MIL TRESCIENTOS CUARENTA Y UN Y 84/100 DOLARES AMERICANOS`

---

## 4. Cuentas Bancarias Oficiales en Documentos
Las proformas deben imprimir textualmente las cuatro cuentas bancarias autorizadas:
1. **Cuenta Soles BCP**: `191-97813480-0-92` (CCI: `00219119781348009255`)
2. **Cuenta Soles Scotiabank**: `207-0381237`
3. **Cuenta Dólares Scotiabank**: `207-0627772` (CCI: `009-017-212070627772-54`)
4. **Cuenta Detracciones Soles BN**: `00-048-075703`

