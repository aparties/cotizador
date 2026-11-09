# 🗃️ DB.md - Documentación y Diccionario de Datos

Documentación técnica del esquema relacional en Neon PostgreSQL con Prisma ORM para **QuickQuote Industrial** (Bicode Control).

---

## 1. Entidades Principales

### 1.1 `customers` (Clientes & Terceros)
Almacena la cartera de clientes corporativos de Bicode Control.

| Campo | Tipo | Nulo | Descripción / Reglas |
| :--- | :--- | :---: | :--- |
| `id` | VARCHAR(30) | No | Identificador CUID primario |
| `ruc` | VARCHAR(11) | No | Número de RUC único (Índice único) |
| `businessName` | VARCHAR(200) | No | Razón Social registrada ante SUNAT |
| `address` | VARCHAR(300) | No | Domicilio fiscal completo |
| `phone` | VARCHAR(50) | Sí | Teléfono o celular de contacto |
| `email` | VARCHAR(100) | Sí | Correo para envío de proformas |
| `defaultPaymentTerm` | VARCHAR(50) | No | Plazo por defecto (ej. '60 DÍAS') |
| `defaultCondition` | VARCHAR(50) | No | Condición ('CRÉDITO' / 'CONTADO') |
| `createdAt` | TIMESTAMP | No | Fecha de creación |
| `updatedAt` | TIMESTAMP | No | Última modificación |

---

### 1.2 `products` (Catálogo de Repuestos)
Catálogo base de 994 repuestos de automatización con precios y número de parte.

| Campo | Tipo | Nulo | Descripción / Reglas |
| :--- | :--- | :---: | :--- |
| `id` | VARCHAR(30) | No | Identificador CUID primario |
| `internalCode`| VARCHAR(50) | No | Código interno único de inventario |
| `partNumber` | VARCHAR(100) | No | Código de parte fabricante (Índice B-Tree) |
| `description` | TEXT | No | Descripción técnica detallada |
| `category` | VARCHAR(100) | No | Categoría ('REPUESTOS', 'EQUIPOS') |
| `brand` | VARCHAR(100) | No | Marca ('SIEMENS', 'ALLEN BRADLEY') |
| `unit` | VARCHAR(30) | No | Unidad de medida ('UNIDADES') |
| `currency` | VARCHAR(10) | No | Moneda ('USD' o 'PEN') |
| `basePrice` | DECIMAL(12,4)| No | Precio venta referencial |
| `purchaseCost`| DECIMAL(12,4)| No | Costo base referencial |

---

### 1.3 `quotes` (Cabecera de Cotizaciones)
Registro formal de la proforma emitida.

| Campo | Tipo | Nulo | Descripción / Reglas |
| :--- | :--- | :---: | :--- |
| `id` | VARCHAR(30) | No | Identificador CUID |
| `code` | VARCHAR(30) | No | Código correlativo único (ej. `0001-0000928`) |
| `status` | ENUM | No | `BORRADOR`, `ENVIADA`, `APROBADA`, `RECHAZADA` |
| `origin` | ENUM | No | `IMPORTACION` o `NACIONAL` |
| `prorationMethod` | ENUM | No | `BY_VALUE` o `BY_UNIT` |
| `marginStrategy` | ENUM | No | `MARKUP` o `GROSS_MARGIN` |
| `customerId` | VARCHAR(30) | Sí | FK hacia `customers.id` |
| `clientRuc` | VARCHAR(11) | No | Snapshot RUC al emitir |
| `clientBusinessName`| VARCHAR(200)| No | Snapshot Razón Social al emitir |
| `clientAddress`| VARCHAR(300)| No | Snapshot Dirección al emitir |
| `issueDate` | DATE | No | Fecha de emisión de la proforma |
| `dueDate` | DATE | No | Fecha de vencimiento comercial |
| `currency` | VARCHAR(30) | No | 'DOLARES AMERICANOS' o 'SOLES' |
| `deliveryTimeDays` | VARCHAR(50)| No | Plazo de entrega (ej. '21 DÍAS') |
| `totalIntlFreightUsd`| DECIMAL(12,4)| No | Flete internacional prorrateable |
| `totalHandlingUsd`| DECIMAL(12,4)| No | Gastos desaduanaje prorrateables |
| `exchangeRateValue`| DECIMAL(8,4) | No | T.C. fijado al momento de cotizar |
| `subtotalGravadoUsd`| DECIMAL(12,4)| No | Base imponible sin IGV |
| `igvAmountUsd` | DECIMAL(12,4)| No | IGV (18%) |
| `totalAmountUsd`| DECIMAL(12,4)| No | Total facturado |
| `totalCostLandedUsd`| DECIMAL(12,4)| No | Costo Landed total de inversión |
| `grossProfitUsd`| DECIMAL(12,4)| No | Utilidad bruta comercial |

---

### 1.4 `quote_items` (Detalle de Repuestos)
Partidas de la cotización con prorrateo individual de costos y márgenes.

| Campo | Tipo | Nulo | Descripción / Reglas |
| :--- | :--- | :---: | :--- |
| `id` | VARCHAR(30) | No | CUID primario |
| `quoteId` | VARCHAR(30) | No | FK hacia `quotes.id` (ON DELETE CASCADE) |
| `position` | INT | No | Orden del ítem en la proforma (1, 2, 3...) |
| `partNumber` | VARCHAR(100) | No | Código de repuesto |
| `description` | TEXT | No | Descripción técnica |
| `quantity` | INT | No | Cantidad cotizada |
| `baseUnitCostUsd` | DECIMAL(12,4)| No | Costo FOB unitario |
| `proratedFreightUsd`| DECIMAL(12,4)| No | Flete prorrateado unitario |
| `proratedInsuranceUsd`| DECIMAL(12,4)| No | 0.75% tabla SUNAT CFR unitario |
| `adValoremRate` | DECIMAL(5,2) | No | Tasa arancelaria (0, 6 u 11%) |
| `adValoremAmountUsd` | DECIMAL(12,4)| No | Arancel unitario liquidado |
| `proratedExpensesUsd`| DECIMAL(12,4)| No | Gastos fijos unitarios prorrateados |
| `landedUnitCostUsd`| DECIMAL(12,4)| No | Costo Landed Real unitario |
| `marginRatePct` | DECIMAL(6,2) | No | % Markup o % Margen aplicado |
| `unitSalePriceNetUsd`| DECIMAL(12,4)| No | Valor venta unitario sin IGV |
| `totalSalePriceNetUsd`| DECIMAL(12,4)| No | Venta neta ítem (P. Unit * Cant) |
| `totalSalePriceWithIgvUsd`| DECIMAL(12,4)| No | Total con IGV (18%) |

---

## 2. Índices y Optimizaciones
- `@@index([partNumber])` en `products` y `quote_items` para búsquedas en caliente.
- `@@index([ruc])` en `customers` para validación rápida de duplicados y autocompletado.
- `@@index([quoteId])` en `quote_items` para agregaciones rápidas de proformas.

